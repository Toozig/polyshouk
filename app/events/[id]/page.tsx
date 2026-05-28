import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BetForm } from "@/components/bets/bet-form";
import { SellSharesForm } from "@/components/bets/sell-shares-form";
import { ResolveEventDialog } from "@/components/events/resolve-event-dialog";
import { auth } from "@/lib/auth";
import { reconcileEventLmsrQ } from "@/lib/bets/reconcile-lmsr";
import { prisma } from "@/lib/db";
import { OutcomeMarketRow } from "@/components/market/outcome-market-row";
import { marketFromEvent } from "@/lib/market";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  await reconcileEventLmsrQ(id);

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      outcomes: true,
      createdBy: { select: { id: true, username: true } },
      resolvedOutcome: true,
      _count: { select: { bets: true } },
    },
  });

  if (!event) notFound();

  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  const dbUser = sessionUser?.id
    ? await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { balance: true },
      })
    : null;

  const now = new Date();
  const bettingOpen =
    event.status === "OPEN" && now < event.closesAt;

  const openBets =
    sessionUser?.id && bettingOpen
      ? await prisma.bet.groupBy({
          by: ["outcomeId"],
          where: {
            userId: sessionUser.id,
            eventId: id,
            status: "PENDING",
            sharesRemaining: { gt: 0 },
          },
          _sum: { sharesRemaining: true },
        })
      : [];

  const positions = openBets.map((row) => ({
    outcomeId: row.outcomeId,
    shares: row._sum.sharesRemaining ?? 0,
  }));
  const isCreator = sessionUser?.id === event.createdById;
  const isAdmin = sessionUser?.role === "ADMIN";
  const canResolve =
    event.status === "OPEN" &&
    (isAdmin || (isCreator && now >= event.closesAt));
  const resolveBlockedReason =
    event.status === "OPEN" && isCreator && now < event.closesAt
      ? `ניתן לפתור את האירוע לאחר ${formatDate(event.closesAt)}`
      : undefined;

  const market = marketFromEvent(event);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <Badge className="bg-blue-600 text-white">{event.category}</Badge>
          <Badge
            variant="outline"
            className={
              event.status === "OPEN"
                ? bettingOpen
                  ? "border-green-500 text-green-400"
                  : "border-yellow-500 text-yellow-400"
                : "border-slate-500 text-slate-400"
            }
          >
            {event.status === "OPEN"
              ? bettingOpen
                ? "פתוח להימורים"
                : "ממתין לפתרון"
              : event.status === "CLOSED"
                ? "סגור"
                : "נפתר"}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-white">{event.title}</h1>
        <p className="text-slate-400 mt-2">{event.description}</p>
        <p className="text-slate-500 text-sm mt-2">
          יוצר: {event.createdBy.username} · נזילות {event.liquidityM} · נסגר
          להימורים: {formatDate(event.closesAt)} · {event._count.bets} הימורים
        </p>
        {(isCreator || isAdmin) && event.status === "OPEN" && (
          <div className="mt-4">
            <ResolveEventDialog
              eventId={event.id}
              eventTitle={event.title}
              outcomes={event.outcomes}
              canResolve={canResolve}
              resolveBlockedReason={resolveBlockedReason}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">תוצאות אפשריות</h2>
          {event.outcomes.map((outcome, index) => (
            <OutcomeMarketRow
              key={outcome.id}
              label={outcome.label}
              market={market}
              outcomeIndex={index}
              isWinner={
                event.status === "RESOLVED" &&
                event.resolvedOutcomeId === outcome.id
              }
            />
          ))}
        </div>

        <div>
          {bettingOpen && dbUser && isCreator ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <p className="text-slate-300 font-medium">אתה יוצר השוק</p>
              <p className="text-slate-400 text-sm mt-2">
                יוצרי אירועים מספקים נזילות ואינם יכולים לסחור באירוע שלהם.
              </p>
            </div>
          ) : bettingOpen && dbUser ? (
            <>
              <BetForm
                eventId={event.id}
                bParameter={event.bParameter}
                liquidityM={event.liquidityM}
                outcomes={event.outcomes}
                userBalance={dbUser.balance}
              />
              <SellSharesForm
                eventId={event.id}
                bParameter={event.bParameter}
                liquidityM={event.liquidityM}
                outcomes={event.outcomes}
                positions={positions}
              />
            </>
          ) : bettingOpen && !session ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <p className="text-slate-400 mb-4">יש להתחבר כדי להניח הימור</p>
            </div>
          ) : event.status === "OPEN" && !bettingOpen ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <p className="text-yellow-400 font-medium">
                תקופת ההימורים הסתיימה
              </p>
              {isCreator && (
                <p className="text-slate-400 text-sm mt-2">
                  בחר את התוצאה המנצחת למעלה
                </p>
              )}
            </div>
          ) : event.status === "RESOLVED" ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <p className="text-green-400 font-semibold">אירוע זה נפתר</p>
              {event.resolvedOutcome && (
                <p className="text-slate-300 mt-2">
                  תוצאה מנצחת: {event.resolvedOutcome.label}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
