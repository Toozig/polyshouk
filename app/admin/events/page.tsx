import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import {
  AdminEventsList,
  type AdminEventListItem,
} from "@/components/admin/admin-events-list";

export const revalidate = 0;

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

  const listItems: AdminEventListItem[] = events.map((event) => ({
    id: event.id,
    eventNumber: event.eventNumber,
    title: event.title,
    description: event.description,
    category: event.category,
    status: event.status,
    closesAt: event.closesAt.toISOString(),
    resolvedOutcomeId: event.resolvedOutcomeId,
    outcomes: event.outcomes,
    createdBy: event.createdBy,
    resolvedOutcome: event.resolvedOutcome,
    _count: event._count,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">ניהול אירועים</h1>
        <CreateEventDialog userBalance={balance} />
      </div>

      <AdminEventsList events={listItems} />
    </div>
  );
}
