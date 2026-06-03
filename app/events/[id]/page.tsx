import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ResolveEventDialog } from "@/components/events/resolve-event-dialog";
import { auth } from "@/lib/auth";
import { reconcileEventLmsrQ } from "@/lib/bets/reconcile-lmsr";
import { prisma } from "@/lib/db";
import { OutcomeTradeList } from "@/components/market/outcome-trade-list";
import { formatDate } from "@/lib/utils";
import { UserLink } from "@/components/user/user-link";
import { eventWhereUniqueFromRouteSegment } from "@/lib/events/event-route-param";
import { aggregatePremiumOutcomeShares } from "@/lib/premium-outcome-shares";
import { PremiumEventInsights } from "@/components/events/premium-event-insights";
import { ResolvedEventBettingSummary } from "@/components/events/resolved-event-betting-summary";
import { EventPriceChart } from "@/components/events/event-price-chart";
import { getEventPriceHistory } from "@/lib/events/price-history";

export const revalidate = 0;

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id: routeSegment } = await params;
  const uniqueWhere = eventWhereUniqueFromRouteSegment(routeSegment);
  if (!uniqueWhere) notFound();

  const eventPreview = await prisma.event.findUnique({
    where: uniqueWhere,
    select: { id: true, eventNumber: true },
  });
  if (!eventPreview) notFound();

  if (routeSegment !== String(eventPreview.eventNumber)) {
    redirect(`/events/${eventPreview.eventNumber}`);
  }

  const eventId = eventPreview.id;
  await reconcileEventLmsrQ(eventId);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      outcomes: true,
      createdBy: { select: { id: true, username: true } },
      resolvedOutcome: true,
      _count: { select: { bets: true } },
    },
  });

  if (!event) notFound();

  const session = await auth();
  const sessionUser = session?.user;

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
            eventId,
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
  const isPremium = Boolean(sessionUser?.isPremium);

  let resolvedPublicBreakdown: ReturnType<
    typeof aggregatePremiumOutcomeShares
  > | null = null;
  let premiumOpenBreakdown: ReturnType<
    typeof aggregatePremiumOutcomeShares
  > | null = null;

  if (event.status === "RESOLVED" && event.resolvedOutcomeId) {
    resolvedPublicBreakdown = aggregatePremiumOutcomeShares(
      await prisma.bet.findMany({
        where: { eventId, status: { in: ["WON", "LOST"] } },
        select: {
          userId: true,
          outcomeId: true,
          sharesRemaining: true,
          payout: true,
          user: { select: { username: true } },
        },
      }),
      event.status,
      event.resolvedOutcomeId
    );
  } else if (isPremium) {
    premiumOpenBreakdown = aggregatePremiumOutcomeShares(
      await prisma.bet.findMany({
        where: {
          eventId,
          status: "PENDING",
          sharesRemaining: { gt: 0 },
        },
        select: {
          userId: true,
          outcomeId: true,
          sharesRemaining: true,
          payout: true,
          user: { select: { username: true } },
        },
      }),
      event.status,
      event.resolvedOutcomeId
    );
  }
  const canResolve =
    event.status === "OPEN" &&
    (isAdmin || (isCreator && now >= event.closesAt));
  const resolveBlockedReason =
    event.status === "OPEN" && isCreator && now < event.closesAt
      ? `ניתן לפתור את האירוע לאחר ${formatDate(event.closesAt)}`
      : undefined;

  const priceHistory = await getEventPriceHistory(eventId);

  const canTrade = Boolean(bettingOpen && dbUser && !isCreator);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <Badge variant="outline" className="border-slate-500 text-slate-300">
            אירוע #{event.eventNumber}
          </Badge>
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
          יוצר: <UserLink username={event.createdBy.username} /> · נזילות{" "}
          {event.liquidityM} · נסגר
          להימורים: {formatDate(event.closesAt)} · {event._count.bets} הימורים
        </p>
        {(isCreator || isAdmin) && event.status === "OPEN" && (
          <div className="mt-4">
            <ResolveEventDialog
              eventRouteKey={String(event.eventNumber)}
              eventTitle={event.title}
              outcomes={event.outcomes}
              canResolve={canResolve}
              resolveBlockedReason={resolveBlockedReason}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">תוצאות אפשריות</h2>

        {bettingOpen && dbUser && isCreator ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
            <p className="text-slate-300 font-medium">אתה יוצר השוק</p>
            <p className="text-slate-400 text-sm mt-1">
              יוצרי אירועים מספקים נזילות ואינם יכולים לסחור באירוע שלהם.
            </p>
          </div>
        ) : bettingOpen && !session ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
            <p className="text-slate-400">יש להתחבר כדי לקנות או למכור מניות</p>
          </div>
        ) : event.status === "OPEN" && !bettingOpen ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
            <p className="text-yellow-400 font-medium">תקופת ההימורים הסתיימה</p>
            {isCreator && (
              <p className="text-slate-400 text-sm mt-1">
                בחר את התוצאה המנצחת למעלה
              </p>
            )}
          </div>
        ) : event.status === "RESOLVED" ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
            <p className="text-green-400 font-semibold">אירוע זה נפתר</p>
            {event.resolvedOutcome && (
              <p className="text-slate-300 mt-1">
                תוצאה מנצחת: {event.resolvedOutcome.label}
              </p>
            )}
          </div>
        ) : null}

        <OutcomeTradeList
          eventId={event.id}
          bParameter={event.bParameter}
          liquidityM={event.liquidityM}
          outcomes={event.outcomes}
          canTrade={canTrade}
          userBalance={dbUser?.balance ?? 0}
          positions={positions}
          resolvedOutcomeId={
            event.status === "RESOLVED" ? event.resolvedOutcomeId : null
          }
        />
      </div>

      <div className="mt-8">
        <EventPriceChart history={priceHistory} />
      </div>

      {resolvedPublicBreakdown && event.resolvedOutcomeId ? (
        <ResolvedEventBettingSummary
          outcomes={event.outcomes.map((o) => ({ id: o.id, label: o.label }))}
          resolvedOutcomeId={event.resolvedOutcomeId}
          breakdownByOutcomeId={resolvedPublicBreakdown}
        />
      ) : null}

      {premiumOpenBreakdown ? (
        <PremiumEventInsights
          outcomes={event.outcomes.map((o) => ({ id: o.id, label: o.label }))}
          breakdownByOutcomeId={premiumOpenBreakdown}
          eventResolved={false}
        />
      ) : null}
    </div>
  );
}
