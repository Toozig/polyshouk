import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ResolveEventDialog } from "@/components/events/resolve-event-dialog";
import { CreatorEventBlock } from "@/components/profile/creator-event-block";

export const revalidate = 0;

export default async function ProfileEventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const createdEvents = await prisma.event.findMany({
    where: { createdById: session.user.id },
    include: {
      outcomes: true,
      resolvedOutcome: { select: { id: true, label: true } },
      _count: { select: { bets: true } },
    },
    orderBy: { closesAt: "desc" },
  });

  const eventIds = createdEvents.map((e) => e.id);
  const betVolumeRows =
    eventIds.length > 0
      ? await prisma.bet.groupBy({
          by: ["eventId"],
          where: { eventId: { in: eventIds } },
          _sum: { amount: true },
        })
      : [];
  const totalBetAmountByEventId = new Map(
    betVolumeRows.map((r) => [r.eventId, r._sum.amount ?? 0])
  );

  const now = new Date();
  const eventsAwaitingResolution = createdEvents.filter(
    (e) => e.status === "OPEN" && now >= e.closesAt
  );
  const eventsStillOpen = createdEvents.filter(
    (e) => e.status === "OPEN" && now < e.closesAt
  );
  const eventsPast = createdEvents.filter(
    (e) => e.status === "RESOLVED" || e.status === "CLOSED"
  );

  const hasAnyCreated = createdEvents.length > 0;
  const hasActiveCreated =
    eventsAwaitingResolution.length > 0 || eventsStillOpen.length > 0;

  return (
    <>
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">אירועים פעילים</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-5">
          {!hasAnyCreated ? (
            <p className="text-slate-400 text-sm leading-relaxed">
              עדיין לא יצרת אירועים.{" "}
              <Link href="/events" className="text-blue-400 hover:underline">
                בעמוד האירועים אפשר לפתוח שוק חדש
              </Link>
              .
            </p>
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
          ) : (
            <>
              {eventsAwaitingResolution.length > 0 && (
                <div className="space-y-3">
                  <p className="text-yellow-400 text-sm font-medium">
                    ממתינים לפתרון ({eventsAwaitingResolution.length})
                  </p>
                  {eventsAwaitingResolution.map((event) => (
                    <CreatorEventBlock
                      key={event.id}
                      event={event}
                      now={now}
                      totalBetAmount={totalBetAmountByEventId.get(event.id) ?? 0}
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
              {eventsStillOpen.length > 0 && (
                <div className="space-y-3">
                  <p className="text-slate-400 text-sm font-medium">
                    פתוחים להימורים ({eventsStillOpen.length})
                  </p>
                  {eventsStillOpen.map((event) => (
                    <CreatorEventBlock
                      key={event.id}
                      event={event}
                      now={now}
                      totalBetAmount={totalBetAmountByEventId.get(event.id) ?? 0}
                      tone="open"
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {eventsPast.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">אירועי עבר</h2>
          <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-5 space-y-3">
            {eventsPast.map((event) => (
              <CreatorEventBlock
                key={event.id}
                event={event}
                now={now}
                totalBetAmount={totalBetAmountByEventId.get(event.id) ?? 0}
                tone="past"
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
