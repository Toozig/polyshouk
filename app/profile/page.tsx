import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileCreatorEventsList } from "@/components/profile/profile-creator-events-list";

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
  const totalBetAmountByEventId = Object.fromEntries(
    betVolumeRows.map((r) => [r.eventId, r._sum.amount ?? 0])
  );

  return (
    <ProfileCreatorEventsList
      createdEvents={createdEvents}
      totalBetAmountByEventId={totalBetAmountByEventId}
      nowIso={new Date().toISOString()}
    />
  );
}
