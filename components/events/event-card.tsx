import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateOdds, formatDate } from "@/lib/utils";
import type { EventWithOutcomes } from "@/types";

interface EventCardProps {
  event: EventWithOutcomes;
}

export function EventCard({ event }: EventCardProps) {
  const totalBets = event.outcomes.reduce(
    (sum, o) => sum + o.totalBetAmount,
    0
  );

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
          נסגר: {formatDate(event.closesAt)}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          {event.outcomes.map((outcome) => {
            const pct = calculateOdds(outcome.totalBetAmount, totalBets);
            return (
              <div key={outcome.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{outcome.label}</span>
                  <span className="text-white font-medium">{pct}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
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
