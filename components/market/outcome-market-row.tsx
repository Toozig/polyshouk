import { formatCoins, cn } from "@/lib/utils";
import {
  formatChancePercent,
  formatPriceCents,
  getOutcomePrices,
  marketFromEvent,
  payoutIfWin,
  quoteBuyByAmount,
  type LmsrMarketState,
} from "@/lib/market";

interface OutcomeMarketRowProps {
  label: string;
  market: LmsrMarketState;
  outcomeIndex: number;
  betAmount?: number;
  selected?: boolean;
  isWinner?: boolean;
  /** רק אחוזים, מחיר למניה ופס — בלי דוגמת קנייה של 100 ערכים */
  compact?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function OutcomeMarketRow({
  label,
  market,
  outcomeIndex,
  betAmount,
  selected,
  isWinner,
  compact,
  onSelect,
  className,
}: OutcomeMarketRowProps) {
  const prices = getOutcomePrices(market);
  const priceCents = prices[outcomeIndex] ?? 50;

  if (compact) {
    const compactBody = (
      <>
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <div className="min-w-0">
            <span className="text-white text-sm font-medium block">
              {label}
              {isWinner && (
                <span className="text-green-400 text-xs mr-1.5">✓ מנצח</span>
              )}
            </span>
            <span className="text-slate-500 text-xs" dir="ltr">
              {formatPriceCents(priceCents)} למניה
            </span>
          </div>
          <div className="text-left shrink-0">
            <div className="text-xl font-bold text-white tabular-nums" dir="ltr">
              {formatChancePercent(priceCents)}
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${priceCents}%` }}
          />
        </div>
      </>
    );

    return (
      <div
        className={cn(
          "rounded-md border px-2.5 py-2",
          isWinner ? "border-green-500/80 bg-slate-800/80" : "border-slate-600/80 bg-slate-800/50",
          className
        )}
      >
        {compactBody}
      </div>
    );
  }

  const spend = betAmount !== undefined && betAmount > 0 ? betAmount : 100;
  const { shares, cost } = quoteBuyByAmount(market, outcomeIndex, spend);
  const payout = payoutIfWin(shares);
  const profit = payout - cost;

  const content = (
    <>
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="min-w-0">
          <span className="text-white font-medium block">
            {label}
            {isWinner && (
              <span className="text-green-400 text-sm mr-2">✓ מנצח</span>
            )}
          </span>
          <span className="text-slate-500 text-xs" dir="ltr">
            {formatPriceCents(priceCents)} למניה
          </span>
        </div>
        <div className="text-left shrink-0">
          <div className="text-3xl font-bold text-white tabular-nums" dir="ltr">
            {formatChancePercent(priceCents)}
          </div>
          <div className="text-slate-500 text-xs">סיכוי שוק (LMSR)</div>
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${priceCents}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="text-green-400 font-semibold">
          לזכות {formatCoins(payout)}
        </span>
        <span className="text-green-400/80 text-xs">
          רווח +{formatCoins(profit)}
        </span>
        {betAmount === undefined && (
          <span className="text-slate-500 text-xs">
            על {formatCoins(100)} · {shares.toLocaleString("he-IL")} מניות
          </span>
        )}
        {betAmount !== undefined && betAmount > 0 && shares >= 1 && (
          <span className="text-slate-500 text-xs">
            על {formatCoins(betAmount)} · {shares.toLocaleString("he-IL")} מניות
            (עלות {formatCoins(cost)})
          </span>
        )}
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full p-3 rounded-lg border text-right transition-colors",
          selected
            ? "border-blue-500 bg-blue-600/20"
            : "border-slate-600 bg-slate-700 hover:border-slate-500",
          className
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "bg-slate-800 border rounded-lg p-4",
        isWinner ? "border-green-500" : "border-slate-700",
        className
      )}
    >
      {content}
    </div>
  );
}

/** Build market state from event + outcomes rows. */
export function marketFromEventRow(event: {
  bParameter: number;
  liquidityM: number;
  outcomes: { lmsrQ: number }[];
}): LmsrMarketState {
  return marketFromEvent(event);
}
