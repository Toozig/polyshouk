import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OutcomeMarketRow } from "@/components/market/outcome-market-row";
import { marketFromEvent } from "@/lib/market";
import { formatDate } from "@/lib/utils";
import type { EventWithOutcomes } from "@/types";

interface EventCardProps {
  event: EventWithOutcomes;
}

export function EventCard({ event }: EventCardProps) {
  const market = marketFromEvent(event);

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-500 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-white text-lg leading-tight">
            {event.title}
          </CardTitle>
          <Badge className="bg-blue-600 text-white shrink-0">
            {event.category}
          </Badge>
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
          href={`/events/${event.id}`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg font-medium transition-colors"
        >
          פרטים ומשחק
        </Link>
      </CardContent>
    </Card>
  );
}
