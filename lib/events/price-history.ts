import { prisma } from "@/lib/db";
import { getOutcomePrices } from "@/lib/market";
import type { Prisma, SnapshotReason } from "@/prisma/generated/prisma/client";

/** A Prisma client usable inside or outside an interactive transaction. */
type DbClient = Prisma.TransactionClient | typeof prisma;

export type { SnapshotReason };

/**
 * Persist the current market state (per-outcome LMSR quantity + implied price)
 * as a single snapshot. Call inside the same transaction as the trade so the
 * snapshot reflects the post-trade state atomically.
 */
export async function recordMarketSnapshot(
  db: DbClient,
  eventId: string,
  reason: SnapshotReason,
  at?: Date
): Promise<void> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: {
      bParameter: true,
      liquidityM: true,
      outcomes: { select: { id: true, lmsrQ: true }, orderBy: { id: "asc" } },
    },
  });
  if (!event || event.outcomes.length === 0) return;

  const prices = getOutcomePrices({
    bParameter: event.bParameter,
    liquidityM: event.liquidityM,
    outcomes: event.outcomes.map((o) => ({ lmsrQ: o.lmsrQ })),
  });

  await db.marketSnapshot.create({
    data: {
      eventId,
      reason,
      ...(at ? { createdAt: at } : {}),
      points: {
        create: event.outcomes.map((o, i) => ({
          outcomeId: o.id,
          lmsrQ: o.lmsrQ,
          priceCents: prices[i] ?? 0,
        })),
      },
    },
  });
}

export type PriceHistoryPoint = {
  /** Snapshot timestamp (ISO string). */
  t: string;
  reason: SnapshotReason;
  /** priceCents keyed by outcomeId. */
  prices: Record<string, number>;
};

export type EventPriceHistory = {
  outcomes: { id: string; label: string }[];
  points: PriceHistoryPoint[];
};

/** Time-ordered price history for an event, ready for charting. */
export async function getEventPriceHistory(
  eventId: string
): Promise<EventPriceHistory> {
  const [outcomes, snapshots] = await Promise.all([
    prisma.outcome.findMany({
      where: { eventId },
      select: { id: true, label: true },
      orderBy: { id: "asc" },
    }),
    prisma.marketSnapshot.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        reason: true,
        points: { select: { outcomeId: true, priceCents: true } },
      },
    }),
  ]);

  const points: PriceHistoryPoint[] = snapshots.map((snap) => {
    const prices: Record<string, number> = {};
    for (const p of snap.points) prices[p.outcomeId] = p.priceCents;
    return {
      t: snap.createdAt.toISOString(),
      reason: snap.reason,
      prices,
    };
  });

  return { outcomes, points };
}
