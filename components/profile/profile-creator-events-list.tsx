"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ResolveEventDialog } from "@/components/events/resolve-event-dialog";
import { EventListSearchBar } from "@/components/events/event-list-search-bar";
import {
  CreatorEventBlock,
  type CreatorEventForProfile,
} from "@/components/profile/creator-event-block";
import {
  buildEventSearchText,
  filterByEventSearch,
  parseSearchWords,
} from "@/lib/events/event-search";

type ProfileCreatorEventsListProps = {
  createdEvents: CreatorEventForProfile[];
  totalBetAmountByEventId: Record<string, number>;
  nowIso: string;
};

function searchTextForCreatorEvent(event: CreatorEventForProfile): string {
  return buildEventSearchText({
    title: event.title,
    category: event.category,
    eventNumber: event.eventNumber,
    outcomes: event.outcomes,
    extra: event.resolvedOutcome ? [event.resolvedOutcome.label] : [],
  });
}

export function ProfileCreatorEventsList({
  createdEvents,
  totalBetAmountByEventId,
  nowIso,
}: ProfileCreatorEventsListProps) {
  const [query, setQuery] = useState("");
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const words = parseSearchWords(query);

  const eventsAwaitingResolution = useMemo(
    () =>
      createdEvents.filter((e) => e.status === "OPEN" && now >= e.closesAt),
    [createdEvents, now]
  );
  const eventsStillOpen = useMemo(
    () => createdEvents.filter((e) => e.status === "OPEN" && now < e.closesAt),
    [createdEvents, now]
  );
  const eventsPast = useMemo(
    () =>
      createdEvents.filter(
        (e) => e.status === "RESOLVED" || e.status === "CLOSED"
      ),
    [createdEvents]
  );

  const filteredAwaiting = useMemo(
    () =>
      filterByEventSearch(eventsAwaitingResolution, query, searchTextForCreatorEvent),
    [eventsAwaitingResolution, query]
  );
  const filteredOpen = useMemo(
    () => filterByEventSearch(eventsStillOpen, query, searchTextForCreatorEvent),
    [eventsStillOpen, query]
  );
  const filteredPast = useMemo(
    () => filterByEventSearch(eventsPast, query, searchTextForCreatorEvent),
    [eventsPast, query]
  );

  const hasAnyCreated = createdEvents.length > 0;
  const hasActiveCreated =
    eventsAwaitingResolution.length > 0 || eventsStillOpen.length > 0;
  const filteredActiveCount = filteredAwaiting.length + filteredOpen.length;
  const filteredTotal =
    filteredAwaiting.length + filteredOpen.length + filteredPast.length;

  return (
    <>
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">אירועים פעילים</h2>
        {hasAnyCreated ? (
          <EventListSearchBar
            value={query}
            onChange={setQuery}
            className="mb-4 max-w-xl"
          />
        ) : null}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-5">
          {!hasAnyCreated ? (
            <p className="text-slate-400 text-sm leading-relaxed">
              עדיין לא יצרת אירועים.{" "}
              <Link href="/events" className="text-blue-400 hover:underline">
                בעמוד האירועים אפשר לפתוח שוק חדש
              </Link>
              .
            </p>
          ) : words.length > 0 && filteredTotal === 0 ? (
            <p className="text-slate-400 text-sm">לא נמצאו אירועים התואמים לחיפוש</p>
          ) : !hasActiveCreated ? (
            <p className="text-slate-400 text-sm leading-relaxed">
              אין כרגע שווקים פעילים (פתוחים או ממתינים לפתרון).
              {eventsPast.length > 0 ? (
                <>
                  {" "}
                  <span className="text-slate-500">
                    אירועי עבר מופיעים בקוביה למטה.
                  </span>
                </>
              ) : null}
            </p>
          ) : filteredActiveCount === 0 && words.length > 0 ? (
            <p className="text-slate-400 text-sm">
              אין אירועים פעילים התואמים לחיפוש
            </p>
          ) : (
            <>
              {filteredAwaiting.length > 0 && (
                <div className="space-y-3">
                  <p className="text-yellow-400 text-sm font-medium">
                    ממתינים לפתרון ({filteredAwaiting.length})
                  </p>
                  {filteredAwaiting.map((event) => (
                    <CreatorEventBlock
                      key={event.id}
                      event={event}
                      now={now}
                      totalBetAmount={totalBetAmountByEventId[event.id] ?? 0}
                      tone="awaiting"
                      resolveSlot={
                        <ResolveEventDialog
                          eventRouteKey={String(event.eventNumber)}
                          eventTitle={event.title}
                          outcomes={event.outcomes}
                          canResolve
                        />
                      }
                    />
                  ))}
                </div>
              )}
              {filteredOpen.length > 0 && (
                <div className="space-y-3">
                  <p className="text-slate-400 text-sm font-medium">
                    פתוחים להימורים ({filteredOpen.length})
                  </p>
                  {filteredOpen.map((event) => (
                    <CreatorEventBlock
                      key={event.id}
                      event={event}
                      now={now}
                      totalBetAmount={totalBetAmountByEventId[event.id] ?? 0}
                      tone="open"
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {(words.length > 0 ? filteredPast.length > 0 : eventsPast.length > 0) ? (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">אירועי עבר</h2>
          <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-5 space-y-3">
            {(words.length > 0 ? filteredPast : eventsPast).map((event) => (
              <CreatorEventBlock
                key={event.id}
                event={event}
                now={now}
                totalBetAmount={totalBetAmountByEventId[event.id] ?? 0}
                tone="past"
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
