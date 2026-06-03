import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPriceCents } from "@/lib/market";
import { formatDate } from "@/lib/utils";
import type { BetStatus } from "@/prisma/generated/prisma/enums";

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

export type ProfileBetRow = {
  id: string;
  amount: number;
  shares: number;
  priceAtBet: number;
  status: BetStatus;
  payout: number | null;
  createdAt: Date;
  event: { id: string; title: string; status: string };
  outcome: { id: string; label: string };
};

export function ProfileBetsTable({ bets }: { bets: ProfileBetRow[] }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
            <TableHead className="text-slate-400">אירוע</TableHead>
            <TableHead className="text-slate-400">תוצאה</TableHead>
            <TableHead className="text-slate-400 text-left">סכום</TableHead>
            <TableHead className="text-slate-400 text-left">מחיר</TableHead>
            <TableHead className="text-slate-400 text-left">לזכות</TableHead>
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
              <TableCell className="text-slate-400 text-left text-sm" dir="ltr">
                {formatPriceCents(bet.priceAtBet)}
              </TableCell>
              <TableCell className="text-left" dir="ltr">
                {bet.status === "PENDING" ? (
                  <span className="text-green-400">
                    {bet.shares.toLocaleString("he-IL")}
                  </span>
                ) : bet.payout !== null && bet.payout > 0 ? (
                  <span className="text-green-400">
                    {bet.payout.toLocaleString("he-IL")}
                  </span>
                ) : (
                  <span className="text-slate-500">0</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={`${statusColors[bet.status]} text-white`}>
                  {statusLabels[bet.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-left" dir="ltr">
                {bet.status === "WON" && bet.payout !== null ? (
                  <span className="text-green-400">
                    {bet.payout.toLocaleString("he-IL")}
                  </span>
                ) : bet.status === "LOST" ? (
                  <span className="text-slate-500">0</span>
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
