"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BetTradeSummary } from "@/components/market/bet-trade-summary";
import {
  formatChancePercent,
  formatPriceCents,
  getOutcomePrices,
  marketFromEvent,
  quoteBuyByAmount,
  quoteSell,
  type LmsrMarketState,
} from "@/lib/market";
import { formatCoins, cn } from "@/lib/utils";
import type { Outcome } from "@/types";

export type OutcomePosition = {
  outcomeId: string;
  shares: number;
};

interface OutcomeTradeListProps {
  eventId: string;
  bParameter: number;
  liquidityM: number;
  outcomes: Outcome[];
  /** Whether the current user may buy/sell on this event. */
  canTrade: boolean;
  userBalance: number;
  positions: OutcomePosition[];
  resolvedOutcomeId?: string | null;
}

export function OutcomeTradeList({
  eventId,
  bParameter,
  liquidityM,
  outcomes,
  canTrade,
  userBalance,
  positions,
  resolvedOutcomeId,
}: OutcomeTradeListProps) {
  const market = marketFromEvent({ bParameter, liquidityM, outcomes });
  const prices = getOutcomePrices(market);

  function sharesOf(outcomeId: string): number {
    return positions.find((p) => p.outcomeId === outcomeId)?.shares ?? 0;
  }

  return (
    <div className="space-y-3">
      {outcomes.map((outcome, index) => {
        const priceCents = prices[index] ?? 50;
        const isWinner = resolvedOutcomeId === outcome.id;
        const heldShares = sharesOf(outcome.id);

        return (
          <div
            key={outcome.id}
            className={cn(
              "bg-slate-800 border rounded-lg p-4",
              isWinner ? "border-green-500" : "border-slate-700"
            )}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <span className="text-white font-medium block">
                  {outcome.label}
                  {isWinner && (
                    <span className="text-green-400 text-sm mr-2">✓ מנצח</span>
                  )}
                </span>
                <span className="text-slate-500 text-xs" dir="ltr">
                  {formatPriceCents(priceCents)} למניה
                </span>
                {heldShares > 0 && (
                  <span className="text-slate-400 text-xs block mt-0.5">
                    מחזיק {heldShares.toLocaleString("he-IL")} מניות
                  </span>
                )}
              </div>
              <div className="text-left shrink-0">
                <div
                  className="text-3xl font-bold text-white tabular-nums"
                  dir="ltr"
                >
                  {formatChancePercent(priceCents)}
                </div>
                <div className="text-slate-500 text-xs">סיכוי שוק</div>
              </div>
            </div>

            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${priceCents}%` }}
              />
            </div>

            {canTrade && (
              <div className="mt-4 flex gap-2">
                <BuyOutcomeDialog
                  eventId={eventId}
                  market={market}
                  outcome={outcome}
                  outcomeIndex={index}
                  userBalance={userBalance}
                />
                <SellOutcomeDialog
                  eventId={eventId}
                  market={market}
                  outcome={outcome}
                  outcomeIndex={index}
                  heldShares={heldShares}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface BuyOutcomeDialogProps {
  eventId: string;
  market: LmsrMarketState;
  outcome: Outcome;
  outcomeIndex: number;
  userBalance: number;
}

function BuyOutcomeDialog({
  eventId,
  market,
  outcome,
  outcomeIndex,
  userBalance,
}: BuyOutcomeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  const prices = getOutcomePrices(market);
  const priceCents = prices[outcomeIndex] ?? 50;
  const { shares, cost } = quoteBuyByAmount(market, outcomeIndex, amount);

  const canConfirm =
    !loading &&
    amount > 0 &&
    shares >= 1 &&
    cost <= amount &&
    cost <= userBalance;

  async function handleBuy() {
    if (amount <= 0) return;
    setLoading(true);

    const response = await fetch("/api/bets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, outcomeId: outcome.id, amount }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "אירעה שגיאה");
      return;
    }

    toast.success(
      `נרכשו ${data.shares} מניות ב-${data.priceAtBet}¢ · לזכות ${formatCoins(data.shares)}`
    );
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
      >
        קנייה
      </Button>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>קניית מניות · {outcome.label}</DialogTitle>
          <DialogDescription className="text-slate-400">
            מחיר LMSR משתנה עם כל עסקה. מניה מנצחת = 1 ערך.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="buy-amount" className="text-slate-300">
            תקציב (ערך)
          </Label>
          <Input
            id="buy-amount"
            type="number"
            min={1}
            max={userBalance}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="bg-slate-700 border-slate-600 text-white text-right"
            dir="ltr"
          />
          <p className="text-slate-500 text-xs">
            יתרה: {formatCoins(userBalance)}
          </p>
        </div>

        {amount > 0 && shares >= 1 && cost <= amount && (
          <BetTradeSummary
            amount={cost}
            priceCents={priceCents}
            outcomeLabel={outcome.label}
            shares={shares}
          />
        )}

        {cost > userBalance && (
          <p className="text-red-400 text-sm">היתרה אינה מספיקה לקנייה זו.</p>
        )}

        <Button
          onClick={handleBuy}
          disabled={!canConfirm}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "מעבד..." : "אשר קנייה"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

interface SellOutcomeDialogProps {
  eventId: string;
  market: LmsrMarketState;
  outcome: Outcome;
  outcomeIndex: number;
  heldShares: number;
}

function SellOutcomeDialog({
  eventId,
  market,
  outcome,
  outcomeIndex,
  heldShares,
}: SellOutcomeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const sellCount = Math.min(shares, heldShares);
  const { proceeds, priceCents, sharesQuoted } = quoteSell(
    market,
    outcomeIndex,
    sellCount
  );

  const canConfirm =
    !loading &&
    shares > 0 &&
    shares <= heldShares &&
    sharesQuoted >= 1 &&
    proceeds >= 1;

  async function handleSell() {
    if (shares <= 0 || shares > heldShares) return;
    setLoading(true);

    const response = await fetch("/api/bets/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, outcomeId: outcome.id, shares }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "אירעה שגיאה");
      return;
    }

    toast.success(
      `נמכרו ${data.sharesSold} מניות · התקבלו ${formatCoins(data.proceeds)}`
    );
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        disabled={heldShares < 1}
        variant="outline"
        className="flex-1 border-amber-500 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40"
      >
        מכירה
      </Button>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>מכירת מניות · {outcome.label}</DialogTitle>
          <DialogDescription className="text-slate-400">
            מכירה לפי LMSR ({formatPriceCents(priceCents)} למניה משוער).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="sell-shares-input" className="text-slate-300">
            מניות למכירה
          </Label>
          <Input
            id="sell-shares-input"
            type="number"
            min={1}
            max={heldShares}
            value={shares}
            onChange={(e) => setShares(Number(e.target.value))}
            className="bg-slate-700 border-slate-600 text-white text-right"
            dir="ltr"
          />
          <p className="text-slate-500 text-xs">
            מקסימום {heldShares.toLocaleString("he-IL")} מניות
          </p>
        </div>

        {sellCount > 0 && sharesQuoted >= 1 && proceeds >= 1 && (
          <p className="text-amber-400 text-sm">
            תמורה משוערת (LMSR): {formatCoins(proceeds)}
            {sharesQuoted < sellCount && (
              <span className="text-slate-500 block text-xs mt-1">
                מקסימום ניתן למכור כרגע: {sharesQuoted} מניות
              </span>
            )}
          </p>
        )}

        <Button
          onClick={handleSell}
          disabled={!canConfirm}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          {loading ? "מעבד..." : `מכור ${sellCount || ""} מניות`.trim()}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
