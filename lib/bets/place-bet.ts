import { prisma } from "@/lib/db";
import { BetError, betErrorMessage } from "@/lib/bets/errors";
import { recordMarketSnapshot } from "@/lib/events/price-history";
import { quotePlaceBet, type PlaceBetQuote } from "@/lib/bets/quotes";
import type { PlaceBetParams } from "@/lib/bets/types";
import type { Bet } from "@/prisma/generated/prisma/client";

export type { PlaceBetParams };

export type { PlaceBetQuote };
export { quotePlaceBet, assertEventOpenForBetting } from "@/lib/bets/quotes";

export async function placeBet(params: PlaceBetParams): Promise<Bet> {
  const { userId, eventId, outcomeId, amount } = params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { outcomes: true },
  });

  if (!event) {
    throw new BetError("EVENT_NOT_FOUND", betErrorMessage("EVENT_NOT_FOUND"));
  }

  const { priceAtBet, shares, cost } = quotePlaceBet(
    event,
    outcomeId,
    amount,
    userId
  );

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.balance < cost) {
    throw new BetError(
      "INSUFFICIENT_BALANCE",
      betErrorMessage("INSUFFICIENT_BALANCE")
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: cost } },
    });

    await tx.outcome.update({
      where: { id: outcomeId },
      data: { lmsrQ: { increment: shares } },
    });

    await tx.event.update({
      where: { id: eventId },
      data: { poolBalance: { increment: cost } },
    });

    const newBet = await tx.bet.create({
      data: {
        userId,
        eventId,
        outcomeId,
        amount: cost,
        shares,
        sharesRemaining: shares,
        priceAtBet,
        status: "PENDING",
      },
    });

    await tx.coinTransaction.create({
      data: {
        userId,
        amount: -cost,
        type: "BET_PLACED",
        referenceId: newBet.id,
        note: `הימור על "${event.title}" (${shares} מניות ב-${priceAtBet}¢)`,
      },
    });

    await recordMarketSnapshot(tx, eventId, "BUY");

    return newBet;
  });
}
