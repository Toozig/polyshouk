import { prisma } from "@/lib/db";
import { EventCard } from "@/components/events/event-card";
import type { EventWithOutcomes } from "@/types";

export const revalidate = 0;

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { status: "OPEN" },
    include: {
      outcomes: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { closesAt: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">אירועים פעילים</h1>
        <p className="text-slate-400 mt-1">
          בחר אירוע והנח הימור על התוצאה הצפויה
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-lg">אין אירועים פתוחים כרגע</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(events as EventWithOutcomes[]).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
