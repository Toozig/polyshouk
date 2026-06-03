import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { usernameFromRouteSegment } from "@/lib/users/user-route";
import { UserAvatar } from "@/components/user/user-avatar";
import { ProfileBetsTable } from "@/components/profile/bets-table";
import { Badge } from "@/components/ui/badge";
import { formatCoins, formatDate } from "@/lib/utils";

export const revalidate = 0;

type UserPageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: UserPageProps): Promise<Metadata> {
  const { username: raw } = await params;
  const username = usernameFromRouteSegment(raw);
  const user = await prisma.user.findUnique({
    where: { username },
    select: { username: true },
  });
  if (!user) return { title: "משתמש לא נמצא" };
  return { title: `${user.username} · פולישוק` };
}

export default async function UserProfilePage({ params }: UserPageProps) {
  const { username: raw } = await params;
  const username = usernameFromRouteSegment(raw);

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      balance: true,
      createdAt: true,
      isPremium: true,
      role: true,
    },
  });
  if (!user) notFound();

  const session = await auth();
  const isSelf = session?.user?.id === user.id;

  const bets = await prisma.bet.findMany({
    where: { userId: user.id },
    include: {
      event: {
        select: { id: true, title: true, status: true },
      },
      outcome: { select: { id: true, label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeBets = bets.filter((b) => b.status === "PENDING");
  const historyBets = bets.filter((b) => b.status !== "PENDING");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
        <div className="flex flex-wrap items-start gap-4">
          <UserAvatar username={user.username} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white" dir="ltr">
                {user.username}
              </h1>
              {user.isPremium ? (
                <Badge className="bg-amber-600 text-white">פרימיום</Badge>
              ) : null}
              {user.role === "ADMIN" ? (
                <Badge className="bg-yellow-600 text-white">מנהל</Badge>
              ) : null}
            </div>
            <div className="mt-4">
              <span className="text-slate-400 text-sm">יתרה:</span>
              <span className="text-3xl font-bold text-blue-400 mr-2">
                {formatCoins(user.balance)}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              חבר מאז {formatDate(user.createdAt)}
            </p>
            {isSelf ? (
              <p className="mt-4">
                <Link
                  href="/profile"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  לסולם הערכים שלי (ניהול אירועים והגדרות)
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>

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

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          היסטוריית הימורים ({historyBets.length})
        </h2>
        {historyBets.length === 0 ? (
          <p className="text-slate-400">אין הימורים בהיסטוריה</p>
        ) : (
          <ProfileBetsTable bets={historyBets} />
        )}
      </section>
    </div>
  );
}
