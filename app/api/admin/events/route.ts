import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  closesAt: z.string().datetime(),
  outcomes: z.array(z.string().min(1)).min(2),
});

async function requireAdmin(): Promise<
  { userId: string } | NextResponse
> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "גישה נדחתה" }, { status: 403 });
  }
  return { userId: session.user.id };
}

export async function GET(): Promise<NextResponse> {
  const adminResult = await requireAdmin();
  if (adminResult instanceof NextResponse) return adminResult;

  const events = await prisma.event.findMany({
    include: {
      outcomes: true,
      createdBy: { select: { id: true, name: true } },
      resolvedOutcome: true,
      _count: { select: { bets: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const adminResult = await requireAdmin();
  if (adminResult instanceof NextResponse) return adminResult;

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, description, category, closesAt, outcomes } = parsed.data;

  const event = await prisma.event.create({
    data: {
      title,
      description,
      category,
      closesAt: new Date(closesAt),
      status: "OPEN",
      createdById: adminResult.userId,
      outcomes: {
        create: outcomes.map((label) => ({ label })),
      },
    },
    include: { outcomes: true },
  });

  return NextResponse.json(event, { status: 201 });
}
