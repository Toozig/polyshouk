import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const resolveSchema = z.object({
  outcomeId: z.string().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "גישה נדחתה" }, { status: 403 });
  }

  const { id: eventId } = await params;
  const body = await request.json();
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { outcomeId } = parsed.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { bets: true, outcomes: true },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  if (event.status !== "OPEN") {
    return NextResponse.json(
      { error: "האירוע כבר נסגר או נפתר" },
      { status: 400 }
    );
  }

  const winningOutcome = event.outcomes.find((o) => o.id === outcomeId);
  if (!winningOutcome) {
    return NextResponse.json({ error: "תוצאה לא תקינה" }, { status: 400 });
  }

  const pendingBets = event.bets.filter((b) => b.status === "PENDING");
  const totalPool = pendingBets.reduce((sum, b) => sum + b.amount, 0);
  const winningBets = pendingBets.filter((b) => b.outcomeId === outcomeId);
  const winningTotal = winningBets.reduce((sum, b) => sum + b.amount, 0);

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: { status: "RESOLVED", resolvedOutcomeId: outcomeId },
    });

    for (const bet of winningBets) {
      const payout =
        winningTotal > 0
          ? Math.floor((bet.amount / winningTotal) * totalPool)
          : 0;

      await tx.bet.update({
        where: { id: bet.id },
        data: { status: "WON", payout },
      });

      await tx.user.update({
        where: { id: bet.userId },
        data: { balance: { increment: payout } },
      });

      await tx.coinTransaction.create({
        data: {
          userId: bet.userId,
          amount: payout,
          type: "BET_WON",
          referenceId: bet.id,
          note: `זכייה על "${event.title}"`,
        },
      });
    }

    const losingBets = pendingBets.filter((b) => b.outcomeId !== outcomeId);
    for (const bet of losingBets) {
      await tx.bet.update({
        where: { id: bet.id },
        data: { status: "LOST" },
      });
    }
  });

  return NextResponse.json({ resolved: true });
}
