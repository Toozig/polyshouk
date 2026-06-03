import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { EventsPageLists } from "@/components/events/events-page-lists";
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

      <EventsPageLists
        myCreatedEvents={myCreatedEvents as EventWithOutcomes[]}
        openEvents={openEvents as EventWithOutcomes[]}
      />
    </div>
  );
}
