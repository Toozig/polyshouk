import { BetError, betErrorMessage } from "@/lib/bets/errors";
import type { OpenBetLot } from "@/lib/bets/types";

export function sumOpenShares(
  lots: OpenBetLot[],
  eventId: string,
  outcomeId: string
): number {
  return lots
    .filter(
      (b) =>
        b.eventId === eventId &&
        b.outcomeId === outcomeId &&
        b.sharesRemaining > 0
    )
    .reduce((sum, b) => sum + b.sharesRemaining, 0);
}

/** FIFO allocation of shares to sell across open bet lots. */
export function allocateSellFifo(
  lots: OpenBetLot[],
  sharesToSell: number
): { lotId: string; shares: number }[] {
  const sorted = [...lots]
    .filter((b) => b.sharesRemaining > 0)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const allocations: { lotId: string; shares: number }[] = [];
  let remaining = sharesToSell;

  for (const lot of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(lot.sharesRemaining, remaining);
    allocations.push({ lotId: lot.id, shares: take });
    remaining -= take;
  }

  if (remaining > 0) {
    throw new BetError(
      "INSUFFICIENT_SHARES",
      betErrorMessage("INSUFFICIENT_SHARES")
    );
  }

  return allocations;
}
