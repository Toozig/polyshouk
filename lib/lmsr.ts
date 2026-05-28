/**
 * Logarithmic Market Scoring Rule (LMSR).
 * Cost(q) = b · ln(Σ exp(qᵢ/b)),  Pᵢ = exp(qᵢ/b) / Σ exp(qⱼ/b).
 */

export function logSumExp(qs: number[], b: number): number {
  if (b <= 0) throw new Error("b must be positive");
  if (qs.length === 0) return 0;
  const scaled = qs.map((q) => q / b);
  const max = Math.max(...scaled);
  const sum = scaled.reduce((acc, t) => acc + Math.exp(t - max), 0);
  return max + Math.log(sum);
}

export function lmsrCost(qs: number[], b: number): number {
  return b * logSumExp(qs, b);
}

export function lmsrBuyCost(
  qs: number[],
  outcomeIndex: number,
  shares: number,
  b: number
): number {
  if (shares <= 0) return 0;
  const next = [...qs];
  next[outcomeIndex] += shares;
  return lmsrCost(next, b) - lmsrCost(qs, b);
}

/** Shares the house can buy back: qᵢ − m (initial qᵢ = m at market open). */
export function lmsrMaxSellableShares(
  qs: number[],
  outcomeIndex: number,
  minQ: number
): number {
  return Math.max(0, Math.floor(qs[outcomeIndex] ?? 0) - minQ);
}

export function lmsrSellProceeds(
  qs: number[],
  outcomeIndex: number,
  shares: number,
  b: number,
  minQ: number = 0
): number {
  if (shares <= 0) return 0;
  const maxSell = lmsrMaxSellableShares(qs, outcomeIndex, minQ);
  if (shares > maxSell) {
    throw new Error("Cannot sell more shares than market holds");
  }
  const next = [...qs];
  next[outcomeIndex] -= shares;
  return lmsrCost(qs, b) - lmsrCost(next, b);
}

/** Implied probability Pᵢ ∈ (0, 1). */
export function lmsrProbability(
  qs: number[],
  outcomeIndex: number,
  b: number
): number {
  const exps = qs.map((q) => Math.exp(q / b));
  const sum = exps.reduce((a, x) => a + x, 0);
  return exps[outcomeIndex]! / sum;
}

/** Largest whole share count affordable for `budget` coins. */
export function lmsrSharesForBudget(
  qs: number[],
  outcomeIndex: number,
  budget: number,
  b: number
): number {
  if (budget <= 0) return 0;

  let lo = 0;
  let hi = Math.max(1, Math.ceil(budget * 4));

  while (lmsrBuyCost(qs, outcomeIndex, hi, b) <= budget) {
    hi *= 2;
    if (hi > 1_000_000) break;
  }

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (lmsrBuyCost(qs, outcomeIndex, mid, b) <= budget) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo;
}

/** b so max market-maker loss ≈ liquidity m for n outcomes (b = m / ln n). */
export function defaultBParameter(liquidityM: number, outcomeCount: number): number {
  if (outcomeCount < 2) return liquidityM;
  return Math.max(1, Math.round(liquidityM / Math.log(outcomeCount)));
}
