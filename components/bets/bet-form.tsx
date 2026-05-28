"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BetTradeSummary } from "@/components/market/bet-trade-summary";
import { OutcomeMarketRow } from "@/components/market/outcome-market-row";
import { getOutcomePrices, marketFromEvent, quoteBuyByAmount } from "@/lib/market";
import { formatCoins } from "@/lib/utils";
import type { Outcome } from "@/types";

interface BetFormProps {
  eventId: string;
  bParameter: number;
  liquidityM: number;
  outcomes: Outcome[];
  userBalance: number;
}

export function BetForm({
  eventId,
  bParameter,
  liquidityM,
  outcomes,
  userBalance,
}: BetFormProps) {
  const router = useRouter();
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>(
    outcomes[0]?.id ?? ""
  );
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  const market = marketFromEvent({ bParameter, liquidityM, outcomes });
  const selectedIndex = outcomes.findIndex((o) => o.id === selectedOutcomeId);
  const selectedOutcome = outcomes[selectedIndex];
  const prices = getOutcomePrices(market);
  const priceCents =
    selectedIndex >= 0 ? prices[selectedIndex]! : prices[0] ?? 50;
  const { shares, cost } =
    selectedIndex >= 0
      ? quoteBuyByAmount(market, selectedIndex, amount)
      : { shares: 0, cost: 0 };

  const isBinary = outcomes.length === 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOutcomeId || amount <= 0) return;

    setLoading(true);

    const response = await fetch("/api/bets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, outcomeId: selectedOutcomeId, amount }),
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
    router.refresh();
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">קנה מניות</CardTitle>
        <p className="text-slate-400 text-sm leading-relaxed">
          מחיר LMSR: הסתברות משתנה עם כל עסקה. מניה מנצחת = 1 ערך.
          {isBinary && " מחירי שני הצדדים תמיד מסתכמים ל-100¢."}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">בחר תוצאה</Label>
            <div className="space-y-2">
              {outcomes.map((outcome, index) => (
                <OutcomeMarketRow
                  key={outcome.id}
                  label={outcome.label}
                  market={market}
                  outcomeIndex={index}
                  betAmount={selectedOutcomeId === outcome.id ? amount : undefined}
                  selected={selectedOutcomeId === outcome.id}
                  onSelect={() => setSelectedOutcomeId(outcome.id)}
                />
              ))}
            </div>
            {isBinary && prices.length === 2 && (
              <p className="text-slate-500 text-xs text-center" dir="ltr">
                {outcomes[0]?.label}: {prices[0]}¢ + {outcomes[1]?.label}:{" "}
                {prices[1]}¢ = 100¢
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-slate-300">
              תקציב (ערך)
            </Label>
            <Input
              id="amount"
              type="number"
              min={1}
              max={userBalance}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="bg-slate-700 border-slate-600 text-white text-right"
              dir="ltr"
            />
            {shares >= 1 && cost <= amount && (
              <p className="text-slate-500 text-xs">
                עלות LMSR משוערת: {formatCoins(cost)} · {shares} מניות
              </p>
            )}
          </div>

          {selectedOutcome && amount > 0 && shares >= 1 && cost <= amount && (
            <BetTradeSummary
              amount={cost}
              priceCents={priceCents}
              outcomeLabel={selectedOutcome.label}
              shares={shares}
            />
          )}

          <Button
            type="submit"
            disabled={
              loading ||
              amount <= 0 ||
              cost > userBalance ||
              shares < 1 ||
              cost > amount
            }
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "מעבד..." : "קנה"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
