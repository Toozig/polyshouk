/**
 * Backfill MarketSnapshot rows for events created before price history existed.
 *
 * Reconstructs the curve from BUY history only (Bet.createdAt + Bet.shares),
 * since sells were never logged as timestamped per-outcome events. Each event
 * gets an INITIAL snapshot at creation time plus one BUY snapshot per bet.
 *
 * Idempotent: events that already have snapshots are skipped.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/backfill-price-history.ts
 */
import "dotenv/config";
import { prisma } from "../lib/db";
import { getOutcomePrices } from "../lib/market";

async function main(): Promise<void> {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      eventNumber: true,
      createdAt: true,
      bParameter: true,
      liquidityM: true,
      outcomes: { select: { id: true }, orderBy: { id: "asc" } },
      _count: { select: { priceSnapshots: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  let backfilled = 0;

  for (const event of events) {
    if (event._count.priceSnapshots > 0) continue;
    if (event.outcomes.length === 0) continue;

    const bParameter = event.bParameter;
    const liquidityM = event.liquidityM;
    const outcomeIds = event.outcomes.map((o) => o.id);
    const q = new Map<string, number>(outcomeIds.map((id) => [id, liquidityM]));

    const bets = await prisma.bet.findMany({
      where: { eventId: event.id },
      select: { outcomeId: true, shares: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const snapshots: {
      reason: "INITIAL" | "BUY";
      createdAt: Date;
    }[] = [{ reason: "INITIAL", createdAt: event.createdAt }];

    for (const bet of bets) {
      q.set(bet.outcomeId, (q.get(bet.outcomeId) ?? liquidityM) + bet.shares);
      snapshots.push({ reason: "BUY", createdAt: bet.createdAt });
    }

    // Recompute prices fresh for every snapshot by replaying q again so each
    // stored snapshot matches the q state at that moment.
    const replayQ = new Map<string, number>(
      outcomeIds.map((id) => [id, liquidityM])
    );
    let betIdx = 0;

    for (const snap of snapshots) {
      if (snap.reason === "BUY") {
        const bet = bets[betIdx++]!;
        replayQ.set(
          bet.outcomeId,
          (replayQ.get(bet.outcomeId) ?? liquidityM) + bet.shares
        );
      }

      const qs = outcomeIds.map((id) => replayQ.get(id) ?? liquidityM);
      const prices = getOutcomePrices({
        bParameter,
        liquidityM,
        outcomes: qs.map((lmsrQ) => ({ lmsrQ })),
      });

      await prisma.marketSnapshot.create({
        data: {
          eventId: event.id,
          reason: snap.reason,
          createdAt: snap.createdAt,
          points: {
            create: outcomeIds.map((outcomeId, i) => ({
              outcomeId,
              lmsrQ: qs[i]!,
              priceCents: prices[i] ?? 0,
            })),
          },
        },
      });
    }

    backfilled++;
    console.log(
      `Event #${event.eventNumber}: wrote ${snapshots.length} snapshot(s).`
    );
  }

  console.log(`Done. Backfilled ${backfilled} event(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
