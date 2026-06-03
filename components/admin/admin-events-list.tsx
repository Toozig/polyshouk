"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ResolveEventDialog } from "@/components/events/resolve-event-dialog";
import { EventListSearchBar } from "@/components/events/event-list-search-bar";
import { UserLink } from "@/components/user/user-link";
import {
  buildEventSearchText,
  filterByEventSearch,
  parseSearchWords,
} from "@/lib/events/event-search";
import { formatDate } from "@/lib/utils";
import type { Outcome } from "@/types";

const statusLabels: Record<string, string> = {
  OPEN: "פתוח",
  CLOSED: "סגור",
  RESOLVED: "נפתר",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-green-600",
  CLOSED: "bg-yellow-600",
  RESOLVED: "bg-slate-600",
};

export type AdminEventListItem = {
  id: string;
  eventNumber: number;
  title: string;
  description: string;
  category: string;
  status: string;
  closesAt: string;
  resolvedOutcomeId: string | null;
  outcomes: Outcome[];
  createdBy: { username: string };
  resolvedOutcome: { label: string } | null;
  _count: { bets: number };
};

function searchTextForAdminEvent(event: AdminEventListItem): string {
  return buildEventSearchText({
    title: event.title,
    description: event.description,
    category: event.category,
    eventNumber: event.eventNumber,
    outcomes: event.outcomes,
    creatorUsername: event.createdBy.username,
    extra: [statusLabels[event.status] ?? event.status],
  });
}

type AdminEventsListProps = {
  events: AdminEventListItem[];
};

export function AdminEventsList({ events }: AdminEventsListProps) {
  const [query, setQuery] = useState("");
  const words = parseSearchWords(query);

  const filtered = useMemo(
    () => filterByEventSearch(events, query, searchTextForAdminEvent),
    [events, query]
  );

  return (
    <>
      {events.length > 0 ? (
        <EventListSearchBar
          value={query}
          onChange={setQuery}
          className="mb-6 max-w-xl"
        />
      ) : null}

      <div className="space-y-4">
        {filtered.map((event) => (
          <div
            key={event.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-slate-500 text-xs font-mono shrink-0">
                    #{event.eventNumber}
                  </span>
                  <h3 className="text-white font-semibold text-lg min-w-0">
                    {event.title}
                  </h3>
                  <Badge
                    className={`${statusColors[event.status]} text-white shrink-0`}
                  >
                    {statusLabels[event.status]}
                  </Badge>
                </div>
                <p className="text-slate-400 text-sm">{event.description}</p>
                <div className="flex gap-4 mt-2 text-slate-500 text-xs">
                  <span>
                    יוצר: <UserLink username={event.createdBy.username} />
                  </span>
                  <span>קטגוריה: {event.category}</span>
                  <span>נסגר: {formatDate(event.closesAt)}</span>
                  <span>{event._count.bets} הימורים</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.outcomes.map((outcome) => (
                    <span
                      key={outcome.id}
                      className={`text-xs px-2 py-1 rounded-full ${
                        event.resolvedOutcomeId === outcome.id
                          ? "bg-green-600/20 text-green-400 border border-green-600"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {outcome.label}
                      {event.resolvedOutcomeId === outcome.id && " ✓"}
                    </span>
                  ))}
                </div>
                {event.status === "RESOLVED" && event.resolvedOutcome && (
                  <p className="text-green-400 text-sm mt-2">
                    תוצאה מנצחת: {event.resolvedOutcome.label}
                  </p>
                )}
              </div>
              {event.status === "OPEN" && (
                <ResolveEventDialog
                  eventRouteKey={String(event.eventNumber)}
                  eventTitle={event.title}
                  outcomes={event.outcomes}
                  canResolve
                />
              )}
            </div>
          </div>
        ))}
        {events.length === 0 ? (
          <p className="text-slate-400 text-center py-8">אין אירועים עדיין</p>
        ) : words.length > 0 && filtered.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            לא נמצאו אירועים התואמים לחיפוש
          </p>
        ) : null}
      </div>
    </>
  );
}
