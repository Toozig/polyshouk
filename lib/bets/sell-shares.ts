import { prisma } from "@/lib/db";
import { BetError, betErrorMessage } from "@/lib/bets/errors";
import { quoteSellShares } from "@/lib/bets/quotes";
import { recordMarketSnapshot } from "@/lib/events/price-history";
import { reconcileEventLmsrQ } from "@/lib/bets/reconcile-lmsr";
import { allocateSellFifo, sumOpenShares } from "@/lib/bets/lots";

import type { SellSharesParams } from "@/lib/bets/types";

export type { SellSharesParams };

export type SellSharesResult = {
  sharesSold: number;
  proceeds: number;
  priceCents: number;
};

export async function sellShares(
  params: SellSharesParams
): Promise<SellSharesResult> {
  const { userId, eventId, outcomeId, shares: sharesToSell } = params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { outcomes: true },
  });

  if (!event) {
    throw new BetError("EVENT_NOT_FOUND", betErrorMessage("EVENT_NOT_FOUND"));
  }

  await reconcileEventLmsrQ(eventId);
  const refreshed = await prisma.event.findUnique({
    where: { id: eventId },
    include: { outcomes: true },
  });
  if (!refreshed) {
    throw new BetError("EVENT_NOT_FOUND", betErrorMessage("EVENT_NOT_FOUND"));
  }

  const { priceCents, proceeds } = quoteSellShares(
    refreshed,
    outcomeId,
    sharesToSell,
    userId
  );

  const openLots = await prisma.bet.findMany({
    where: {
      userId,
      eventId,
      outcomeId,
      status: "PENDING",
      sharesRemaining: { gt: 0 },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      eventId: true,
      outcomeId: true,
      sharesRemaining: true,
      createdAt: true,
    },
  });

  const totalHeld = sumOpenShares(openLots, eventId, outcomeId);
  if (totalHeld < sharesToSell) {
    throw new BetError(
      "INSUFFICIENT_SHARES",
      betErrorMessage("INSUFFICIENT_SHARES")
    );
  }

  const allocations = allocateSellFifo(openLots, sharesToSell);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: proceeds } },
    });

    await tx.outcome.update({
      where: { id: outcomeId },
      data: { lmsrQ: { decrement: sharesToSell } },
    });

    await tx.event.update({
      where: { id: eventId },
      data: { poolBalance: { decrement: proceeds } },
    });

    for (const { lotId, shares } of allocations) {
      await tx.bet.update({
        where: { id: lotId },
        data: { sharesRemaining: { decrement: shares } },
      });
    }

    await tx.coinTransaction.create({
      data: {
        userId,
        amount: proceeds,
        type: "BET_SOLD",
        referenceId: eventId,
        note: `מכירת ${sharesToSell} מניות על "${refreshed.title}" (${priceCents}¢)`,
      },
    });

    await recordMarketSnapshot(tx, eventId, "SELL");
  });

  return { sharesSold: sharesToSell, proceeds, priceCents };
}
