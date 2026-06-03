import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { formatCoins, formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/user/user-avatar";
import { userProfilePath } from "@/lib/users/user-route";
import Link from "next/link";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, balance: true, createdAt: true, role: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <UserAvatar username={user.username} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-white" dir="ltr">
              {user.username}
            </h1>
            <Link
              href={userProfilePath(user.username)}
              className="text-sm text-blue-400 hover:text-blue-300 mt-1 inline-block"
            >
              עמוד פרופיל ציבורי
            </Link>
          </div>
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
      </div>
      <ProfileTabs isAdmin={user.role === "ADMIN"} />
      {children}
    </div>
  );
}
