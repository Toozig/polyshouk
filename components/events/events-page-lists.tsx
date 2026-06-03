"use client";

import { useMemo, useState } from "react";
import { EventCard } from "@/components/events/event-card";
import { EventListSearchBar } from "@/components/events/event-list-search-bar";
import {
  buildEventSearchText,
  filterByEventSearch,
  parseSearchWords,
} from "@/lib/events/event-search";
import type { EventWithOutcomes } from "@/types";

type EventsPageListsProps = {
  myCreatedEvents: EventWithOutcomes[];
  openEvents: EventWithOutcomes[];
};

function searchTextForEvent(event: EventWithOutcomes): string {
  return buildEventSearchText({
    title: event.title,
    description: event.description,
    category: event.category,
    eventNumber: event.eventNumber,
    outcomes: event.outcomes,
    creatorUsername: event.createdBy.username,
  });
}

export function EventsPageLists({
  myCreatedEvents,
  openEvents,
}: EventsPageListsProps) {
  const [query, setQuery] = useState("");
  const words = parseSearchWords(query);

  const filteredMine = useMemo(
    () => filterByEventSearch(myCreatedEvents, query, searchTextForEvent),
    [myCreatedEvents, query]
  );
  const filteredOpen = useMemo(
    () => filterByEventSearch(openEvents, query, searchTextForEvent),
    [openEvents, query]
  );

  const totalCount = myCreatedEvents.length + openEvents.length;
  const filteredCount = filteredMine.length + filteredOpen.length;
  const showSearch = totalCount > 0;

  if (totalCount === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-lg">אין אירועים פתוחים כרגע</p>
      </div>
    );
  }

  return (
    <>
      {showSearch ? (
        <EventListSearchBar
          value={query}
          onChange={setQuery}
          className="mb-8 max-w-xl"
        />
      ) : null}

      {words.length > 0 && filteredCount === 0 ? (
        <p className="text-slate-400 text-center py-12">
          לא נמצאו אירועים התואמים לחיפוש
        </p>
      ) : null}

      {filteredMine.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">האירועים שלי</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMine.map((event) => (
              <EventCard key={event.id} event={event} showEventStatus />
            ))}
          </div>
        </section>
      ) : null}

      {filteredOpen.length > 0 ? (
        <section>
          {filteredMine.length > 0 || myCreatedEvents.length > 0 ? (
            <h2 className="text-xl font-semibold text-white mb-4">
              אירועים פתוחים
            </h2>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpen.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
