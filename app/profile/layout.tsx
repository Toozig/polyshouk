import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { formatCoins, formatDate } from "@/lib/utils";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, balance: true, createdAt: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-white">{user.username}</h1>
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
      <ProfileTabs />
      {children}
    </div>
  );
}
