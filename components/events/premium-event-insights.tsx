import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CURRENCY_NAME } from "@/lib/constants";
import { formatCoins } from "@/lib/utils";
import type { PremiumUserOutcomeRow } from "@/lib/premium-outcome-shares";

type OutcomeLite = { id: string; label: string };

export function PremiumEventInsights({
  outcomes,
  breakdownByOutcomeId,
  eventResolved,
}: {
  outcomes: OutcomeLite[];
  breakdownByOutcomeId: Map<string, PremiumUserOutcomeRow[]>;
  /** When true, winning outcome column uses actual payouts; others stay hypothetical. */
  eventResolved: boolean;
}) {
  return (
    <div className="mt-10 space-y-8 border-t border-slate-700 pt-8">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-xl font-semibold text-white">תובנות פרימיום</h2>
        <Badge className="bg-amber-600 text-white">פרימיום</Badge>
      </div>
      <p className="text-slate-400 text-sm max-w-2xl">
        לכל תוצאה: מי החזיק מניות, כמה, ושווי ב-{CURRENCY_NAME} אם תוצאה זו מנצחת
        (מניה מנצחת = 1 {CURRENCY_NAME}).{" "}
        {eventResolved
          ? "בעמודת התוצאה שנבחרה בפועל מוצג הרווח שהועבר לחשבון."
          : null}
      </p>

      {outcomes.map((outcome) => {
        const rows = breakdownByOutcomeId.get(outcome.id) ?? [];
        return (
          <div key={outcome.id} className="space-y-2">
            <h3 className="text-lg font-medium text-slate-200">{outcome.label}</h3>
            {rows.length === 0 ? (
              <p className="text-slate-500 text-sm">אין פוזיציות בחישוב זה.</p>
            ) : (
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">משתמש</TableHead>
                      <TableHead className="text-slate-400 text-left" dir="ltr">
                        מניות
                      </TableHead>
                      <TableHead className="text-slate-400 text-left" dir="ltr">
                        רווח אם מנצחת
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.userId} className="border-slate-700">
                        <TableCell
                          className="text-white font-medium"
                          dir="ltr"
                        >
                          {row.username}
                        </TableCell>
                        <TableCell
                          className="text-slate-300 text-left"
                          dir="ltr"
                        >
                          {row.shares}
                        </TableCell>
                        <TableCell
                          className="text-slate-300 text-left"
                          dir="ltr"
                        >
                          {formatCoins(row.winCoins)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
