import { prisma } from "@/lib/db";
import { payoutIfWin } from "@/lib/market";

export async function resolveEvent(
  eventId: string,
  outcomeId: string
): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { bets: true, outcomes: true },
  });

  if (!event) {
    throw new Error("EVENT_NOT_FOUND");
  }

  if (event.status !== "OPEN") {
    throw new Error("EVENT_NOT_OPEN");
  }

  const winningOutcome = event.outcomes.find((o) => o.id === outcomeId);
  if (!winningOutcome) {
    throw new Error("INVALID_OUTCOME");
  }

  const pendingBets = event.bets.filter(
    (b) => b.status === "PENDING" && b.sharesRemaining > 0
  );
  const winningBets = pendingBets.filter((b) => b.outcomeId === outcomeId);

  const totalPayout = winningBets.reduce(
    (sum, b) => sum + payoutIfWin(b.sharesRemaining),
    0
  );

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: { status: "RESOLVED", resolvedOutcomeId: outcomeId },
    });

    for (const bet of winningBets) {
      const payout = payoutIfWin(bet.sharesRemaining);

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
        data: { status: "LOST", payout: 0 },
      });
    }

    await tx.event.update({
      where: { id: eventId },
      data: { poolBalance: { decrement: totalPayout } },
    });

    const updated = await tx.event.findUnique({
      where: { id: eventId },
      select: { poolBalance: true },
    });
    const surplus = updated?.poolBalance ?? 0;

    if (surplus > 0) {
      await tx.user.update({
        where: { id: event.createdById },
        data: { balance: { increment: surplus } },
      });

      await tx.coinTransaction.create({
        data: {
          userId: event.createdById,
          amount: surplus,
          type: "EVENT_LIQUIDITY_RETURN",
          referenceId: eventId,
          note: `החזר נזילות ועודף מ-"${event.title}"`,
        },
      });

      await tx.event.update({
        where: { id: eventId },
        data: { poolBalance: 0 },
      });
    }
  });
}
