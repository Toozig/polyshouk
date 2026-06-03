import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { EventCard } from "@/components/events/event-card";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import type { EventWithOutcomes } from "@/types";

export const revalidate = 0;

const eventListInclude = {
  outcomes: true,
  createdBy: { select: { id: true, username: true } as const },
} as const;

export default async function EventsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [user, myCreatedEvents, openEvents] = userId
    ? await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { balance: true },
        }),
        prisma.event.findMany({
          where: { createdById: userId },
          include: eventListInclude,
          orderBy: { createdAt: "desc" },
        }),
        prisma.event.findMany({
          where: {
            status: "OPEN",
            NOT: { createdById: userId },
          },
          include: eventListInclude,
          orderBy: { closesAt: "asc" },
        }),
      ])
    : [
        null,
        [] as EventWithOutcomes[],
        await prisma.event.findMany({
          where: { status: "OPEN" },
          include: eventListInclude,
          orderBy: { closesAt: "asc" },
        }),
      ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">אירועים פעילים</h1>
          <p className="text-slate-400 mt-1">
            בחר אירוע והנח הימור על התוצאה הצפויה, או צור אירוע משלך
          </p>
        </div>
        {user ? (
          <CreateEventDialog userBalance={user.balance} />
        ) : (
          <p className="text-slate-500 text-sm">
            <a href="/login" className="text-blue-400 hover:underline">
              התחבר
            </a>{" "}
            כדי ליצור אירוע
          </p>
        )}
      </div>

      {myCreatedEvents.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">האירועים שלי</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(myCreatedEvents as EventWithOutcomes[]).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                showEventStatus
              />
            ))}
          </div>
        </section>
      ) : null}

      {openEvents.length === 0 && myCreatedEvents.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-lg">אין אירועים פתוחים כרגע</p>
        </div>
      ) : openEvents.length > 0 ? (
        <section>
          {myCreatedEvents.length > 0 ? (
            <h2 className="text-xl font-semibold text-white mb-4">
              אירועים פתוחים
            </h2>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(openEvents as EventWithOutcomes[]).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
