import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCoins } from "@/lib/utils";
import { UserLink } from "@/components/user/user-link";
import type { PremiumUserOutcomeRow } from "@/lib/premium-outcome-shares";

type OutcomeLite = { id: string; label: string };

export function ResolvedEventBettingSummary({
  outcomes,
  resolvedOutcomeId,
  breakdownByOutcomeId,
}: {
  outcomes: OutcomeLite[];
  resolvedOutcomeId: string;
  breakdownByOutcomeId: Map<string, PremiumUserOutcomeRow[]>;
}) {
  return (
    <div className="mt-10 space-y-8 border-t border-slate-700 pt-8">
      <div>
        <h2 className="text-xl font-semibold text-white">תוצאות ההימורים</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-2xl">
          פירוט לפי תוצאה: מי החזיק מניות לפני הפיתרון, כמה, האם ניצח או הפסיד,
          והזכוי בפועל.
        </p>
      </div>

      {outcomes.map((outcome) => {
        const rows = breakdownByOutcomeId.get(outcome.id) ?? [];
        const isWinningOutcome = outcome.id === resolvedOutcomeId;
        return (
          <div key={outcome.id} className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-medium text-slate-200">
                {outcome.label}
              </h3>
              {isWinningOutcome ? (
                <Badge className="bg-green-700 text-white">תוצאה מנצחת</Badge>
              ) : null}
            </div>
            {rows.length === 0 ? (
              <p className="text-slate-500 text-sm">אין הימורים על תוצאה זו.</p>
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
                        זכוי
                      </TableHead>
                      <TableHead className="text-slate-400">תוצאה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const won = isWinningOutcome && row.shares > 0;
                      const lost = !isWinningOutcome && row.shares > 0;
                      return (
                        <TableRow key={row.userId} className="border-slate-700">
                          <TableCell className="font-medium">
                            <UserLink
                              username={row.username}
                              className="text-white hover:text-blue-300"
                            />
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
                            {formatCoins(row.receivedCoins)}
                          </TableCell>
                          <TableCell>
                            {won ? (
                              <Badge className="bg-green-600 text-white">
                                ניצח
                              </Badge>
                            ) : lost ? (
                              <Badge
                                variant="outline"
                                className="border-red-500 text-red-400"
                              >
                                הפסיד
                              </Badge>
                            ) : (
                              <span className="text-slate-500 text-sm">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
