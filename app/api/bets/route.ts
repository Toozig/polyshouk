import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const betSchema = z.object({
  eventId: z.string().min(1),
  outcomeId: z.string().min(1),
  amount: z.number().int().positive(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = betSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { eventId, outcomeId, amount } = parsed.data;
  const userId = session.user.id;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "OPEN") {
    return NextResponse.json(
      { error: "האירוע אינו פתוח להימורים" },
      { status: 400 }
    );
  }

  const outcome = await prisma.outcome.findUnique({ where: { id: outcomeId } });
  if (!outcome || outcome.eventId !== eventId) {
    return NextResponse.json({ error: "תוצאה לא תקינה" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.balance < amount) {
    return NextResponse.json({ error: "יתרה לא מספקת" }, { status: 400 });
  }

  const bet = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });

    await tx.outcome.update({
      where: { id: outcomeId },
      data: { totalBetAmount: { increment: amount } },
    });

    const newBet = await tx.bet.create({
      data: { userId, eventId, outcomeId, amount, status: "PENDING" },
    });

    await tx.coinTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: "BET_PLACED",
        referenceId: newBet.id,
        note: `הימור על "${event.title}"`,
      },
    });

    return newBet;
  });

  return NextResponse.json(bet, { status: 201 });
}
