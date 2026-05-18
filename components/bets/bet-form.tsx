"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateOdds, formatCoins } from "@/lib/utils";
import type { Outcome } from "@/types";

interface BetFormProps {
  eventId: string;
  outcomes: Outcome[];
  totalBetAmount: number;
  userBalance: number;
}

export function BetForm({
  eventId,
  outcomes,
  totalBetAmount,
  userBalance,
}: BetFormProps) {
  const router = useRouter();
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>(
    outcomes[0]?.id ?? ""
  );
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);

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

    toast.success("ההימור נרשם בהצלחה!");
    router.refresh();
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">הנח הימור</CardTitle>
        <p className="text-slate-400 text-sm">
          יתרה נוכחית: {formatCoins(userBalance)}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">בחר תוצאה</Label>
            <div className="space-y-2">
              {outcomes.map((outcome) => {
                const pct = calculateOdds(outcome.totalBetAmount, totalBetAmount);
                return (
                  <button
                    key={outcome.id}
                    type="button"
                    onClick={() => setSelectedOutcomeId(outcome.id)}
                    className={`w-full p-3 rounded-lg border text-right transition-colors ${
                      selectedOutcomeId === outcome.id
                        ? "border-blue-500 bg-blue-600/20 text-white"
                        : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{outcome.label}</span>
                      <span className="text-sm">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-600 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-slate-300">
              סכום להמרה (מטבעות)
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
          </div>

          <Button
            type="submit"
            disabled={loading || amount <= 0 || amount > userBalance}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "מעבד..." : "הנח הימור"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
