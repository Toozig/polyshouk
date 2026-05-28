import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { ResolveEventDialog } from "@/components/events/resolve-event-dialog";

export const revalidate = 0;

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

export default async function AdminEventsPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") redirect("/");

  const [events, adminUser] = await Promise.all([
    prisma.event.findMany({
      include: {
        outcomes: true,
        createdBy: { select: { username: true } },
        resolvedOutcome: true,
        _count: { select: { bets: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true },
    }),
  ]);

  const balance = adminUser?.balance ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">ניהול אירועים</h1>
        <CreateEventDialog userBalance={balance} />
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-semibold text-lg">
                    {event.title}
                  </h3>
                  <Badge className={`${statusColors[event.status]} text-white`}>
                    {statusLabels[event.status]}
                  </Badge>
                </div>
                <p className="text-slate-400 text-sm">{event.description}</p>
                <div className="flex gap-4 mt-2 text-slate-500 text-xs">
                  <span>יוצר: {event.createdBy.username}</span>
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
                  eventId={event.id}
                  eventTitle={event.title}
                  outcomes={event.outcomes}
                  canResolve
                />
              )}
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-slate-400 text-center py-8">אין אירועים עדיין</p>
        )}
      </div>
    </div>
  );
}
