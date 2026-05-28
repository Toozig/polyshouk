"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPriceCents, marketFromEvent, quoteSell } from "@/lib/market";
import { formatCoins } from "@/lib/utils";
import type { Outcome } from "@/types";

export type OutcomePosition = {
  outcomeId: string;
  shares: number;
};

interface SellSharesFormProps {
  eventId: string;
  bParameter: number;
  liquidityM: number;
  outcomes: Outcome[];
  positions: OutcomePosition[];
}

export function SellSharesForm({
  eventId,
  bParameter,
  liquidityM,
  outcomes,
  positions,
}: SellSharesFormProps) {
  const router = useRouter();
  const held = positions.filter((p) => p.shares > 0);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>(
    held[0]?.outcomeId ?? ""
  );
  const [shares, setShares] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const market = marketFromEvent({ bParameter, liquidityM, outcomes });
  const position = held.find((p) => p.outcomeId === selectedOutcomeId);
  const maxShares = position?.shares ?? 0;
  const outcomeIndex = outcomes.findIndex((o) => o.id === selectedOutcomeId);
  const sellCount = Math.min(shares, maxShares);
  const { proceeds, priceCents, sharesQuoted } =
    outcomeIndex >= 0
      ? quoteSell(market, outcomeIndex, sellCount)
      : { proceeds: 0, priceCents: 50, sharesQuoted: 0 };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOutcomeId || shares <= 0 || shares > maxShares) return;

    setLoading(true);
    const response = await fetch("/api/bets/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        outcomeId: selectedOutcomeId,
        shares,
      }),
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
    router.refresh();
  }

  if (held.length === 0) return null;

  return (
    <Card className="bg-slate-800 border-slate-700 mt-4">
      <CardHeader>
        <CardTitle className="text-white">מכור מניות</CardTitle>
        <p className="text-slate-400 text-sm">
          מכירה לפי LMSR ({formatPriceCents(priceCents)} למניה משוער)
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">תוצאה</Label>
            <div className="space-y-2">
              {held.map((pos) => {
                const outcome = outcomes.find((o) => o.id === pos.outcomeId);
                if (!outcome) return null;
                return (
                  <button
                    key={pos.outcomeId}
                    type="button"
                    onClick={() => {
                      setSelectedOutcomeId(pos.outcomeId);
                      setShares(1);
                    }}
                    className={`w-full p-3 rounded-lg border text-right transition-colors ${
                      selectedOutcomeId === pos.outcomeId
                        ? "border-amber-500 bg-amber-600/20"
                        : "border-slate-600 bg-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <span className="text-white font-medium">{outcome.label}</span>
                    <span className="text-slate-400 text-sm block mt-1">
                      {pos.shares.toLocaleString("he-IL")} מניות פתוחות
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sell-shares" className="text-slate-300">
              מניות למכירה
            </Label>
            <Input
              id="sell-shares"
              type="number"
              min={1}
              max={maxShares}
              value={shares}
              onChange={(e) => setShares(Number(e.target.value))}
              required
              className="bg-slate-700 border-slate-600 text-white text-right"
              dir="ltr"
            />
            <p className="text-slate-500 text-xs">
              מקסימום {maxShares.toLocaleString("he-IL")} מניות
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
            type="submit"
            disabled={
              loading ||
              shares <= 0 ||
              shares > maxShares ||
              sharesQuoted < 1 ||
              proceeds < 1 ||
              !selectedOutcomeId
            }
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? "מעבד..." : `מכור ${shares} מניות`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
