import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCoins } from "@/lib/utils";
import type { BalanceHistoryRow } from "@/lib/transactions/balance-history";

function formatDateTime(iso: Date): string {
  return new Date(iso).toLocaleString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BalanceHistory({ rows }: { rows: BalanceHistoryRow[] }) {
  return (
    <div className="flex flex-col min-h-0">
      <h2 className="text-xl font-semibold text-white mb-4">היסטוריית ערכים</h2>
      {rows.length === 0 ? (
        <p className="text-slate-400 text-sm">אין תנועות בחשבון עדיין.</p>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400 text-right">תאריך</TableHead>
                <TableHead className="text-slate-400 text-left" dir="ltr">
                  סכום
                </TableHead>
                <TableHead className="text-slate-400 text-right">סיבה</TableHead>
                <TableHead className="text-slate-400 text-right">אירוע</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="border-slate-700">
                  <TableCell className="text-slate-400 text-sm whitespace-nowrap">
                    {formatDateTime(row.createdAt)}
                  </TableCell>
                  <TableCell
                    className={`text-left font-medium tabular-nums whitespace-nowrap ${
                      row.amount >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                    dir="ltr"
                  >
                    {row.amount >= 0 ? "+" : ""}
                    {formatCoins(row.amount)}
                  </TableCell>
                  <TableCell className="text-slate-200 text-sm max-w-[14rem]">
                    {row.reason}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.eventHref ? (
                      <Link
                        href={row.eventHref}
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                      >
                        {row.eventTitle ?? "לאירוע"}
                      </Link>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
