import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BalanceHistory } from "@/components/profile/balance-history";
import { buildBalanceHistoryRows } from "@/lib/transactions/balance-history";

export const revalidate = 0;

export default async function ProfileHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const transactions = await prisma.coinTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows = await buildBalanceHistoryRows(transactions);

  return (
    <section>
      <BalanceHistory rows={rows} />
    </section>
  );
}
