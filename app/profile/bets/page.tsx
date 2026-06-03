import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileBetsTable } from "@/components/profile/bets-table";

export const revalidate = 0;

export default async function ProfileBetsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id },
    include: {
      event: { select: { id: true, title: true, status: true } },
      outcome: { select: { id: true, label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeBets = bets.filter((b) => b.status === "PENDING");
  const historyBets = bets.filter((b) => b.status !== "PENDING");

  return (
    <>
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">
          הימורים פעילים ({activeBets.length})
        </h2>
        {activeBets.length === 0 ? (
          <p className="text-slate-400">אין הימורים פעילים</p>
        ) : (
          <ProfileBetsTable bets={activeBets} />
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">
          היסטוריית הימורים ({historyBets.length})
        </h2>
        {historyBets.length === 0 ? (
          <p className="text-slate-400">אין הימורים בהיסטוריה</p>
        ) : (
          <ProfileBetsTable bets={historyBets} />
        )}
      </section>
    </>
  );
}
