import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  CURRENCY_NAME,
  DEFAULT_LIQUIDITY_M,
  EVENT_CLOSES_AT_MAX,
  MIN_LIQUIDITY_M,
} from "@/lib/constants";
import { defaultBForEvent } from "@/lib/market";
import { recordMarketSnapshot } from "@/lib/events/price-history";
import { prisma } from "@/lib/db";

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  closesAt: z.string().datetime(),
  outcomes: z.array(z.string().min(1)).min(2),
  liquidityM: z.number().int().min(MIN_LIQUIDITY_M).optional(),
});

export async function GET(): Promise<NextResponse> {
  const events = await prisma.event.findMany({
    where: { status: "OPEN" },
    include: {
      outcomes: true,
      createdBy: { select: { id: true, username: true } },
    },
    orderBy: { closesAt: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, description, category, closesAt, outcomes } = parsed.data;
  const liquidityM = parsed.data.liquidityM ?? DEFAULT_LIQUIDITY_M;
  const closesAtDate = new Date(closesAt);
  if (closesAtDate <= new Date()) {
    return NextResponse.json(
      { error: "תאריך הסגירה חייב להיות בעתיד" },
      { status: 400 }
    );
  }

  if (closesAtDate > EVENT_CLOSES_AT_MAX) {
    return NextResponse.json(
      { error: "תאריך הסגירה לא יכול להיות אחרי 2 בנובמבר 2026" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { balance: true },
  });

  if (!user || user.balance < liquidityM) {
    return NextResponse.json(
      {
        error: `יתרה לא מספקת (נדרשים ${liquidityM} ${CURRENCY_NAME} לנזילות)`,
      },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const bParameter = defaultBForEvent(liquidityM, outcomes.length);

  const event = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: liquidityM } },
    });

    const created = await tx.event.create({
      data: {
        title,
        description,
        category,
        closesAt: closesAtDate,
        status: "OPEN",
        createdById: userId,
        liquidityM,
        bParameter,
        poolBalance: liquidityM,
        outcomes: {
          create: outcomes.map((label) => ({
            label,
            lmsrQ: liquidityM,
          })),
        },
      },
      include: { outcomes: true },
    });

    await tx.coinTransaction.create({
      data: {
        userId,
        amount: -liquidityM,
        type: "EVENT_CREATED",
        referenceId: created.id,
        note: `יצירת אירוע "${title}" (נזילות ${liquidityM})`,
      },
    });

    await recordMarketSnapshot(tx, created.id, "INITIAL");

    return created;
  });

  return NextResponse.json(event, { status: 201 });
}
