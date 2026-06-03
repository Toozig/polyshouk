import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminUsersTable } from "@/components/admin/admin-users-table";

export const revalidate = 0;

export default async function ProfileAdminPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id) redirect("/login");
  if (role !== "ADMIN") redirect("/profile");

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
    <div>
      <p className="text-slate-400 text-sm mb-4">
        ניהול מלא זמין גם ב־
        <Link href="/admin" className="text-yellow-400 hover:underline mr-1">
          לוח הניהול
        </Link>
      </p>
      <AdminUsersTable users={users} />
    </div>
  );
}
