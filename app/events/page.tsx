import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { EventCard } from "@/components/events/event-card";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import type { EventWithOutcomes } from "@/types";

export const revalidate = 0;

export default async function EventsPage() {
  const session = await auth();

  const events = await prisma.event.findMany({
    where: { status: "OPEN" },
    include: {
      outcomes: true,
      createdBy: { select: { id: true, username: true } },
    },
    orderBy: { closesAt: "asc" },
  });

  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true },
      })
    : null;

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
