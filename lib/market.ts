import {
  defaultBParameter,
  lmsrBuyCost,
  lmsrMaxSellableShares,
  lmsrProbability,
  lmsrSellProceeds,
  lmsrSharesForBudget,
} from "@/lib/lmsr";
import { LIQUIDITY_DEPTH_MULTIPLIER } from "@/lib/constants";

/** Price bounds: 1¢–99¢ per share (1 share = 1 ערך if it wins). */
export const MIN_PRICE_CENTS = 1;
export const MAX_PRICE_CENTS = 99;
export const DEFAULT_PRICE_CENTS = 50;
export const PAYOUT_PER_SHARE = 1;

export type LmsrOutcomeState = { lmsrQ: number };

export type LmsrMarketState = {
  bParameter: number;
  /** Floor for qᵢ (creator liquidity m). */
  liquidityM: number;
  outcomes: LmsrOutcomeState[];
};

/** @deprecated Use LmsrOutcomeState */
export type OutcomeLiquidity = LmsrOutcomeState;

export function qsFromMarket(market: LmsrMarketState): number[] {
  return market.outcomes.map((o) => o.lmsrQ);
}

/**
 * Implied market prices (cents) from LMSR probabilities.
 * Binary markets: prices sum to 100¢.
 */
export function getOutcomePrices(market: LmsrMarketState): number[] {
  const n = market.outcomes.length;
  if (n === 0) return [];

  const b = market.bParameter;
  const qs = qsFromMarket(market);
  const raw = qs.map((_, i) => lmsrProbability(qs, i, b) * 100);

  const floors = raw.map((r) => Math.floor(r));
  const prices = [...floors];
  let remainder = 100 - prices.reduce((a, x) => a + x, 0);
  const byFrac = raw
    .map((r, i) => ({ i, frac: r - floors[i]! }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) {
    prices[byFrac[k % n]!.i]!++;
  }

  if (n === 2) {
    prices[0] = Math.max(
      MIN_PRICE_CENTS,
      Math.min(MAX_PRICE_CENTS, prices[0]!)
    );
    prices[1] = 100 - prices[0]!;
  }

  return prices;
}

export function priceForOutcomeIndex(
  index: number,
  market: LmsrMarketState
): number {
  const prices = getOutcomePrices(market);
  return prices[index] ?? DEFAULT_PRICE_CENTS;
}

export function quoteBuyByAmount(
  market: LmsrMarketState,
  outcomeIndex: number,
  amount: number
): { shares: number; cost: number; priceCents: number } {
  const qs = qsFromMarket(market);
  const b = market.bParameter;
  const shares = lmsrSharesForBudget(qs, outcomeIndex, amount, b);
  const cost = lmsrBuyCost(qs, outcomeIndex, shares, b);
  const priceCents = priceForOutcomeIndex(outcomeIndex, market);
  return { shares, cost, priceCents };
}

export function quoteBuyByShares(
  market: LmsrMarketState,
  outcomeIndex: number,
  shares: number
): { cost: number; priceCents: number } {
  const qs = qsFromMarket(market);
  const cost = Math.ceil(lmsrBuyCost(qs, outcomeIndex, shares, market.bParameter));
  const priceCents = priceForOutcomeIndex(outcomeIndex, market);
  return { cost, priceCents };
}

export function quoteSell(
  market: LmsrMarketState,
  outcomeIndex: number,
  shares: number
): { proceeds: number; priceCents: number; sharesQuoted: number } {
  const qs = qsFromMarket(market);
  const minQ = market.liquidityM;
  const maxFromMarket = lmsrMaxSellableShares(qs, outcomeIndex, minQ);
  const sharesQuoted = Math.min(Math.max(0, shares), maxFromMarket);
  const priceCents = priceForOutcomeIndex(outcomeIndex, market);

  if (sharesQuoted < 1) {
    return { proceeds: 0, priceCents, sharesQuoted: 0 };
  }

  const proceeds = Math.floor(
    lmsrSellProceeds(qs, outcomeIndex, sharesQuoted, market.bParameter, minQ)
  );
  return { proceeds, priceCents, sharesQuoted };
}

/** Shares received when spending `amount` at fixed `priceCents` (legacy display helper). */
export function sharesFromSpend(amount: number, priceCents: number): number {
  if (amount <= 0 || priceCents <= 0) return 0;
  return Math.floor((amount * 100) / priceCents);
}

/** Coins received when selling `shares` at `priceCents` (legacy display helper). */
export function coinsFromSell(shares: number, priceCents: number): number {
  if (shares <= 0 || priceCents <= 0) return 0;
  return Math.floor((shares * priceCents) / 100);
}

/** Max outcomes shown on event previews (lists, profile) — not on the event detail page. */
export const EVENT_PREVIEW_OUTCOME_LIMIT = 3;

export type IndexedOutcome<T> = {
  outcome: T;
  outcomeIndex: number;
};

/**
 * Top outcomes by LMSR implied price (highest chance first).
 * When there are more than `limit`, optionally pins `pinOutcomeId` (e.g. resolved winner).
 */
export function topOutcomesForEventPreview<
  T extends { id: string } & LmsrOutcomeState,
>(
  outcomes: T[],
  market: LmsrMarketState,
  options?: { limit?: number; pinOutcomeId?: string | null }
): IndexedOutcome<T>[] {
  const limit = options?.limit ?? EVENT_PREVIEW_OUTCOME_LIMIT;
  if (outcomes.length <= limit) {
    return outcomes.map((outcome, outcomeIndex) => ({ outcome, outcomeIndex }));
  }

  const prices = getOutcomePrices(market);
  const ranked = outcomes
    .map((outcome, outcomeIndex) => ({
      outcome,
      outcomeIndex,
      priceCents: prices[outcomeIndex] ?? 0,
    }))
    .sort(
      (a, b) =>
        b.priceCents - a.priceCents || a.outcomeIndex - b.outcomeIndex
    );

  let selected = ranked.slice(0, limit);

  const pinId = options?.pinOutcomeId;
  if (pinId && !selected.some((row) => row.outcome.id === pinId)) {
    const pinned = ranked.find((row) => row.outcome.id === pinId);
    if (pinned) {
      selected = [...selected.slice(0, limit - 1), pinned].sort(
        (a, b) =>
          b.priceCents - a.priceCents || a.outcomeIndex - b.outcomeIndex
      );
    }
  }

  return selected.map(({ outcome, outcomeIndex }) => ({ outcome, outcomeIndex }));
}

export function marketFromEvent(event: {
  bParameter: number;
  liquidityM: number;
  outcomes: LmsrOutcomeState[];
}): LmsrMarketState {
  return {
    bParameter: event.bParameter,
    liquidityM: event.liquidityM,
    outcomes: event.outcomes,
  };
}

export function defaultBForEvent(
  liquidityM: number,
  outcomeCount: number
): number {
  return defaultBParameter(liquidityM, outcomeCount, LIQUIDITY_DEPTH_MULTIPLIER);
}

/** Each winning share pays 1 ערך. */
export function payoutIfWin(shares: number): number {
  return shares * PAYOUT_PER_SHARE;
}

export function profitIfWin(amount: number, priceCents: number): number {
  return payoutIfWin(sharesFromSpend(amount, priceCents)) - amount;
}

export function formatPriceCents(priceCents: number): string {
  return `${priceCents}¢`;
}

export function formatChancePercent(priceCents: number): string {
  return `${priceCents}%`;
}

export function lossIfWrong(amount: number): number {
  return amount;
}
