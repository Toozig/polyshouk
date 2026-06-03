import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminUsersTable } from "@/components/admin/admin-users-table";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      isPremium: true,
      balance: true,
      createdAt: true,
      _count: { select: { bets: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">ניהול משתמשים</h1>
      <AdminUsersTable users={users} />
    </div>
  );
}
