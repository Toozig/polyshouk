import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCoins, formatDate } from "@/lib/utils";
import { GiftCoinsDialog } from "@/components/admin/gift-coins-dialog";
import { SetBalanceDialog } from "@/components/admin/set-balance-dialog";
import { TogglePremiumButton } from "@/components/admin/toggle-premium-button";

export type AdminUserRow = {
  id: string;
  username: string;
  role: string;
  isPremium: boolean;
  balance: number;
  createdAt: Date;
  _count: { bets: number };
};

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
            <TableHead className="text-slate-400">שם משתמש</TableHead>
            <TableHead className="text-slate-400">תפקיד</TableHead>
            <TableHead className="text-slate-400 text-left">פרימיום</TableHead>
            <TableHead className="text-slate-400 text-left">יתרה</TableHead>
            <TableHead className="text-slate-400 text-left">הימורים</TableHead>
            <TableHead className="text-slate-400 text-left">הצטרף</TableHead>
            <TableHead className="text-slate-400 text-left">פעולות</TableHead>
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
              <TableCell>
                <TogglePremiumButton
                  userId={user.id}
                  isPremium={user.isPremium}
                />
              </TableCell>
              <TableCell className="text-slate-300 text-left" dir="ltr">
                {formatCoins(user.balance)}
              </TableCell>
              <TableCell className="text-slate-300 text-left" dir="ltr">
                {user._count.bets}
              </TableCell>
              <TableCell
                className="text-slate-400 text-left text-sm"
                dir="ltr"
              >
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2 justify-end">
                  <GiftCoinsDialog userId={user.id} userName={user.username} />
                  <SetBalanceDialog
                    userId={user.id}
                    userName={user.username}
                    currentBalance={user.balance}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
