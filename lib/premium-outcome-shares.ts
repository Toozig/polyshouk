import type { EventStatus } from "@/prisma/generated/prisma/enums";
import { PAYOUT_PER_SHARE } from "@/lib/market";

export type PremiumBetForBreakdown = {
  userId: string;
  outcomeId: string;
  sharesRemaining: number;
  payout: number | null;
  user: { username: string };
};

export type PremiumUserOutcomeRow = {
  userId: string;
  username: string;
  /** Shares still held (open market) or shares at resolution (resolved). */
  shares: number;
  /** Open: hypothetical coins if this outcome wins. Resolved: same as win column for winners, else hypothetical. */
  winCoins: number;
  /** After resolution: coins paid to the user for this outcome (0 on losing outcomes). */
  receivedCoins: number;
};

/**
 * Aggregates bets per (outcome, user) for premium event insights.
 * Open markets: pending bets with shares remaining.
 * Resolved: winning/losing bet rows from resolution.
 */
export function aggregatePremiumOutcomeShares(
  bets: PremiumBetForBreakdown[],
  eventStatus: EventStatus,
  resolvedOutcomeId: string | null
): Map<string, PremiumUserOutcomeRow[]> {
  type Acc = { shares: number; payoutSum: number; username: string };
  const acc = new Map<string, Acc>();

  for (const b of bets) {
    const key = `${b.outcomeId}\0${b.userId}`;
    const cur =
      acc.get(key) ?? {
        shares: 0,
        payoutSum: 0,
        username: b.user.username,
      };
    cur.shares += b.sharesRemaining;
    if (b.payout != null) cur.payoutSum += b.payout;
    acc.set(key, cur);
  }

  const byOutcome = new Map<string, PremiumUserOutcomeRow[]>();

  for (const [key, { shares, payoutSum, username }] of acc) {
    const nul = key.indexOf("\0");
    const outcomeId = key.slice(0, nul);
    const userId = key.slice(nul + 1);

    const isWinningOutcomeColumn =
      eventStatus === "RESOLVED" && outcomeId === resolvedOutcomeId;
    const winCoins = isWinningOutcomeColumn
      ? payoutSum
      : shares * PAYOUT_PER_SHARE;
    const receivedCoins =
      eventStatus === "RESOLVED" && isWinningOutcomeColumn ? payoutSum : 0;

    const row: PremiumUserOutcomeRow = {
      userId,
      username,
      shares,
      winCoins,
      receivedCoins,
    };

    const list = byOutcome.get(outcomeId) ?? [];
    list.push(row);
    byOutcome.set(outcomeId, list);
  }

  for (const list of byOutcome.values()) {
    list.sort((a, b) => a.username.localeCompare(b.username, "he"));
  }

  return byOutcome;
}
