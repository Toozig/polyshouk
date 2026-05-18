import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BetForm } from "@/components/bets/bet-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateOdds, formatDate } from "@/lib/utils";

export const revalidate = 0;

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      outcomes: true,
      createdBy: { select: { id: true, name: true } },
      _count: { select: { bets: true } },
    },
  });

  if (!event) notFound();

  const session = await auth();
  const sessionUser = session?.user as { id?: string } | undefined;

  const dbUser = sessionUser?.id
    ? await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { balance: true },
      })
    : null;

  const totalBetAmount = event.outcomes.reduce(
    (sum, o) => sum + o.totalBetAmount,
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Badge className="bg-blue-600 text-white">{event.category}</Badge>
          <Badge
            variant="outline"
            className={
              event.status === "OPEN"
                ? "border-green-500 text-green-400"
                : "border-slate-500 text-slate-400"
            }
          >
            {event.status === "OPEN"
              ? "פתוח"
              : event.status === "CLOSED"
                ? "סגור"
                : "נפתר"}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-white">{event.title}</h1>
        <p className="text-slate-400 mt-2">{event.description}</p>
        <p className="text-slate-500 text-sm mt-2">
          נסגר: {formatDate(event.closesAt)} · {event._count.bets} הימורים
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">תוצאות אפשריות</h2>
          {event.outcomes.map((outcome) => {
            const pct = calculateOdds(outcome.totalBetAmount, totalBetAmount);
            return (
              <div
                key={outcome.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">{outcome.label}</span>
                  <span className="text-2xl font-bold text-blue-400">
                    {pct}%
                  </span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  {outcome.totalBetAmount.toLocaleString("he-IL")} מטבעות הוימרו
                </p>
              </div>
            );
          })}
        </div>

        <div>
          {event.status === "OPEN" && dbUser ? (
            <BetForm
              eventId={event.id}
              outcomes={event.outcomes}
              totalBetAmount={totalBetAmount}
              userBalance={dbUser.balance}
            />
          ) : event.status === "OPEN" && !session ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <p className="text-slate-400 mb-4">
                יש להתחבר כדי להנח הימור
              </p>
            </div>
          ) : event.status === "RESOLVED" ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <p className="text-green-400 font-semibold">אירוע זה נפתר</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
