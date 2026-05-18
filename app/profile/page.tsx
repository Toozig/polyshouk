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
import type { BetStatus } from "@/prisma/generated/prisma/enums";

export const revalidate = 0;

const statusLabels: Record<BetStatus, string> = {
  PENDING: "ממתין",
  WON: "זכה",
  LOST: "הפסיד",
};

const statusColors: Record<BetStatus, string> = {
  PENDING: "bg-yellow-600",
  WON: "bg-green-600",
  LOST: "bg-red-600",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, balance: true, createdAt: true },
  });

  if (!user) redirect("/login");

  const bets = await prisma.bet.findMany({
    where: { userId: user.id },
    include: {
      event: { select: { id: true, title: true, status: true } },
      outcome: { select: { id: true, label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeBets = bets.filter((b) => b.status === "PENDING");
  const historyBets = bets.filter((b) => b.status !== "PENDING");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
        <p className="text-slate-400 text-sm">{user.email}</p>
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

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">
          הימורים פעילים ({activeBets.length})
        </h2>
        {activeBets.length === 0 ? (
          <p className="text-slate-400">אין הימורים פעילים</p>
        ) : (
          <BetsTable bets={activeBets} />
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          היסטוריה ({historyBets.length})
        </h2>
        {historyBets.length === 0 ? (
          <p className="text-slate-400">אין הימורים בהיסטוריה</p>
        ) : (
          <BetsTable bets={historyBets} />
        )}
      </section>
    </div>
  );
}

type BetRow = {
  id: string;
  amount: number;
  status: BetStatus;
  payout: number | null;
  createdAt: Date;
  event: { id: string; title: string; status: string };
  outcome: { id: string; label: string };
};

function BetsTable({ bets }: { bets: BetRow[] }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
            <TableHead className="text-slate-400">אירוע</TableHead>
            <TableHead className="text-slate-400">תוצאה</TableHead>
            <TableHead className="text-slate-400 text-left">סכום</TableHead>
            <TableHead className="text-slate-400">סטטוס</TableHead>
            <TableHead className="text-slate-400 text-left">תשלום</TableHead>
            <TableHead className="text-slate-400 text-left">תאריך</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bets.map((bet) => (
            <TableRow key={bet.id} className="border-slate-700">
              <TableCell className="text-white">{bet.event.title}</TableCell>
              <TableCell className="text-slate-300">{bet.outcome.label}</TableCell>
              <TableCell className="text-slate-300 text-left" dir="ltr">
                {bet.amount.toLocaleString("he-IL")}
              </TableCell>
              <TableCell>
                <Badge className={`${statusColors[bet.status]} text-white`}>
                  {statusLabels[bet.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-left" dir="ltr">
                {bet.payout !== null ? (
                  <span className="text-green-400">
                    {bet.payout.toLocaleString("he-IL")}
                  </span>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </TableCell>
              <TableCell className="text-slate-400 text-left text-sm" dir="ltr">
                {formatDate(bet.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
