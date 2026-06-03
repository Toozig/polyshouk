import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OutcomeMarketRow } from "@/components/market/outcome-market-row";
import { marketFromEvent } from "@/lib/market";
import { formatDate } from "@/lib/utils";
import type { EventWithOutcomes } from "@/types";
import { EventStatus } from "@/prisma/generated/prisma/enums";

const EVENT_STATUS_LABEL: Record<
  (typeof EventStatus)[keyof typeof EventStatus],
  string
> = {
  OPEN: "פתוח",
  CLOSED: "נסגר להימורים",
  RESOLVED: "הוכרע",
};

interface EventCardProps {
  event: EventWithOutcomes;
  /** When set, show market status (e.g. on the creator event list). */
  showEventStatus?: boolean;
}

export function EventCard({ event, showEventStatus }: EventCardProps) {
  const market = marketFromEvent(event);

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-500 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-slate-500 font-mono">#{event.eventNumber}</p>
            <CardTitle className="text-white text-lg leading-tight">
              {event.title}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className="bg-blue-600 text-white">
              {event.category}
            </Badge>
            {showEventStatus ? (
              <Badge
                variant="outline"
                className={
                  event.status === "OPEN"
                    ? "border-emerald-500/60 text-emerald-300"
                    : event.status === "CLOSED"
                      ? "border-amber-500/60 text-amber-200"
                      : "border-violet-500/60 text-violet-200"
                }
              >
                {EVENT_STATUS_LABEL[event.status]}
              </Badge>
            ) : null}
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          נסגר: {formatDate(event.closesAt)} · נזילות {event.liquidityM}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          {event.outcomes.map((outcome, index) => (
            <OutcomeMarketRow
              key={outcome.id}
              label={outcome.label}
              market={market}
              outcomeIndex={index}
            />
          ))}
        </div>

        <Link
          href={`/events/${event.eventNumber}`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg font-medium transition-colors"
        >
          פרטים ומשחק
        </Link>
      </CardContent>
    </Card>
  );
}
