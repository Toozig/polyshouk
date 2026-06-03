import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { OutcomeMarketRow } from "@/components/market/outcome-market-row";
import { marketFromEvent, topOutcomesForEventPreview } from "@/lib/market";
import { formatCoins, formatDate } from "@/lib/utils";
import type { Outcome } from "@/types";

export type CreatorEventForProfile = {
  id: string;
  eventNumber: number;
  title: string;
  category: string;
  closesAt: Date;
  status: "OPEN" | "CLOSED" | "RESOLVED";
  liquidityM: number;
  poolBalance: number;
  bParameter: number;
  resolvedOutcomeId: string | null;
  outcomes: Outcome[];
  resolvedOutcome: { id: string; label: string } | null;
  _count: { bets: number };
};

function creatorEventStatusLabel(
  event: Pick<CreatorEventForProfile, "status" | "closesAt">,
  now: Date
): string {
  if (event.status === "RESOLVED") return "נפתר";
  if (event.status === "CLOSED") return "סגור";
  if (event.status === "OPEN") {
    return now < event.closesAt ? "פתוח להימורים" : "ממתין לפתרון";
  }
  return event.status;
}

export function CreatorEventBlock({
  event,
  now,
  totalBetAmount,
  tone,
  resolveSlot,
}: {
  event: CreatorEventForProfile;
  now: Date;
  totalBetAmount: number;
  tone: "awaiting" | "open" | "past";
  resolveSlot?: ReactNode;
}) {
  const market = marketFromEvent(event);
  const previewOutcomes = topOutcomesForEventPreview(event.outcomes, market, {
    pinOutcomeId: event.resolvedOutcomeId,
  });
  const hiddenOutcomeCount = event.outcomes.length - previewOutcomes.length;
  const borderClass =
    tone === "awaiting"
      ? "border-yellow-600/40"
      : tone === "open"
        ? "border-slate-600"
        : "border-slate-600/60";

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 bg-slate-900/40 ${borderClass}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-mono text-xs">
              #{event.eventNumber}
            </span>
            <Link
              href={`/events/${event.eventNumber}`}
              className="text-white font-medium hover:text-blue-400"
            >
              {event.title}
            </Link>
            <Badge variant="outline" className="text-xs border-slate-500 text-slate-300">
              {event.category}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${
                event.status === "OPEN" && now < event.closesAt
                  ? "border-green-500 text-green-400"
                  : event.status === "OPEN"
                    ? "border-yellow-500 text-yellow-400"
                    : event.status === "RESOLVED"
                      ? "border-slate-500 text-slate-400"
                      : "border-slate-500 text-slate-400"
              }`}
            >
              {creatorEventStatusLabel(event, now)}
            </Badge>
          </div>
          <p className="text-slate-500 text-xs">
            נסגר לשוק: {formatDate(event.closesAt)}
            {event.status === "RESOLVED" && event.resolvedOutcome ? (
              <span className="text-green-400/90 mr-2">
                {" "}
                · מנצח: {event.resolvedOutcome.label}
              </span>
            ) : null}
          </p>
        </div>
        {resolveSlot ? <div className="shrink-0">{resolveSlot}</div> : null}
      </div>
      <p className="text-slate-400 text-xs leading-relaxed">
        נזילות ראשונית (מ): {formatCoins(event.liquidityM)} · יתרת בריכה:{" "}
        {formatCoins(event.poolBalance)} · סה״כ ערכים שהושקעו בהימורים (עלויות
        קנייה): {formatCoins(totalBetAmount)} · {event._count.bets} רשומות הימור
      </p>
      <div className="space-y-2">
        <p className="text-slate-500 text-xs">הסתברויות שוק (LMSR) לפי תוצאה</p>
        {previewOutcomes.map(({ outcome, outcomeIndex }) => (
          <OutcomeMarketRow
            key={outcome.id}
            compact
            label={outcome.label}
            market={market}
            outcomeIndex={outcomeIndex}
            isWinner={event.resolvedOutcomeId === outcome.id}
          />
        ))}
        {hiddenOutcomeCount > 0 ? (
          <p className="text-slate-500 text-xs">
            ועוד {hiddenOutcomeCount} תשובות ·{" "}
            <Link
              href={`/events/${event.eventNumber}`}
              className="text-blue-400 hover:underline"
            >
              כל התשובות בדף האירוע
            </Link>
          </p>
        ) : null}
      </div>
      <Link
        href={`/events/${event.eventNumber}`}
        className="inline-block text-sm text-blue-400 hover:text-blue-300 hover:underline"
      >
        דף האירוע →
      </Link>
    </div>
  );
}
