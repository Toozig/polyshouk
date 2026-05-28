import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCoins, formatDate } from "@/lib/utils";
import { GiftCoinsDialog } from "@/components/admin/gift-coins-dialog";

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
      balance: true,
      createdAt: true,
      _count: { select: { bets: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">ניהול משתמשים</h1>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">שם משתמש</TableHead>
              <TableHead className="text-slate-400">תפקיד</TableHead>
              <TableHead className="text-slate-400 text-left">יתרה</TableHead>
              <TableHead className="text-slate-400 text-left">הימורים</TableHead>
              <TableHead className="text-slate-400 text-left">הצטרף</TableHead>
              <TableHead className="text-slate-400"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-slate-700">
                <TableCell className="text-white font-medium" dir="ltr">
                  {user.username}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      user.role === "ADMIN"
                        ? "bg-yellow-600 text-white"
                        : "bg-slate-600 text-white"
                    }
                  >
                    {user.role === "ADMIN" ? "מנהל" : "משתמש"}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300 text-left" dir="ltr">
                  {formatCoins(user.balance)}
                </TableCell>
                <TableCell className="text-slate-300 text-left" dir="ltr">
                  {user._count.bets}
                </TableCell>
                <TableCell className="text-slate-400 text-left text-sm" dir="ltr">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  <GiftCoinsDialog userId={user.id} userName={user.username} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
