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
import { formatDate } from "@/lib/utils";
import { CreateCodeButton } from "@/components/admin/create-code-button";

export const revalidate = 0;

export default async function AdminCodesPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") redirect("/");

  const codes = await prisma.inviteCode.findMany({
    include: {
      usedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">קודי הזמנה</h1>
        <CreateCodeButton />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">קוד</TableHead>
              <TableHead className="text-slate-400 text-left">נוצר</TableHead>
              <TableHead className="text-slate-400">סטטוס</TableHead>
              <TableHead className="text-slate-400">שימוש על ידי</TableHead>
              <TableHead className="text-slate-400 text-left">תאריך שימוש</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((code) => (
              <TableRow key={code.id} className="border-slate-700">
                <TableCell
                  className="text-white font-mono font-semibold"
                  dir="ltr"
                >
                  {code.code}
                </TableCell>
                <TableCell className="text-slate-400 text-left text-sm" dir="ltr">
                  {formatDate(code.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      code.usedById
                        ? "bg-slate-600 text-white"
                        : "bg-green-600 text-white"
                    }
                  >
                    {code.usedById ? "נוצל" : "פנוי"}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300">
                  {code.usedBy?.name ?? (
                    <span className="text-slate-500">לא נוצל</span>
                  )}
                </TableCell>
                <TableCell className="text-slate-400 text-left text-sm" dir="ltr">
                  {code.usedAt ? formatDate(code.usedAt) : "-"}
                </TableCell>
              </TableRow>
            ))}
            {codes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-slate-400 py-8"
                >
                  אין קודי הזמנה
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
