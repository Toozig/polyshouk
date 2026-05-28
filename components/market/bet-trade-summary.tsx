import {
  formatChancePercent,
  formatPriceCents,
  lossIfWrong,
  payoutIfWin,
} from "@/lib/market";
import { formatCoins } from "@/lib/utils";

interface BetTradeSummaryProps {
  amount: number;
  priceCents: number;
  outcomeLabel?: string;
  shares: number;
}

/** Buy breakdown: LMSR cost → shares → payout → profit/loss. */
export function BetTradeSummary({
  amount,
  priceCents,
  outcomeLabel,
  shares,
}: BetTradeSummaryProps) {
  const payout = payoutIfWin(shares);
  const profit = payout - amount;

  if (amount <= 0 || shares < 1) return null;

  return (
    <div className="rounded-lg border border-slate-600 bg-slate-900/60 p-4 space-y-3 text-sm">
      <p className="text-slate-400 text-xs">
        מחיר LMSR = הסתברות שוק · כל מניה מזכה ב-1 ערך אם צדקת
        {outcomeLabel ? ` · ${outcomeLabel}` : ""}
      </p>

      <div className="flex justify-between items-baseline">
        <span className="text-slate-300">סיכוי שוק</span>
        <span className="text-2xl font-bold text-white" dir="ltr">
          {formatChancePercent(priceCents)}
        </span>
      </div>

      <div className="flex justify-between text-slate-300">
        <span>מחיר למניה (משוער)</span>
        <span dir="ltr">{formatPriceCents(priceCents)}</span>
      </div>

      <div className="rounded-md bg-slate-800/80 px-3 py-2 text-slate-300" dir="ltr">
        <span className="text-slate-500">LMSR: </span>
        <span className="text-white font-medium">
          {shares.toLocaleString("he-IL")} מניות
        </span>
        <span className="text-slate-500"> בעלות </span>
        {formatCoins(amount)}
      </div>

      <div className="border-t border-slate-700 pt-3 space-y-2">
        <div className="flex justify-between text-green-400 font-semibold">
          <span>אם תצדק — תקבל</span>
          <span dir="ltr">{formatCoins(payout)}</span>
        </div>
        <div className="flex justify-between text-green-400/90 text-xs">
          <span>רווח נקי</span>
          <span dir="ltr">+{formatCoins(profit)}</span>
        </div>
        <div className="flex justify-between text-red-400/90 text-xs">
          <span>אם טועה — תקבל</span>
          <span dir="ltr">0 ערך (הפסד {formatCoins(lossIfWrong(amount))})</span>
        </div>
      </div>
    </div>
  );
}
