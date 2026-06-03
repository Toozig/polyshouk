/**
 * One-off: add a fixed coin amount to every user, with ledger rows (ADMIN_GIFT).
 *
 * Usage: DATABASE_URL=... npx tsx scripts/credit-all-users.ts
 * Optional: CREDIT_AMOUNT=2000 (default 2000)
 */
import "dotenv/config";
import { prisma } from "../lib/db";

const AMOUNT = Number.parseInt(process.env.CREDIT_AMOUNT ?? "2000", 10);
const NOTE = `זיכוי גורף — ${AMOUNT} ערך`;

async function main(): Promise<void> {
  if (!Number.isFinite(AMOUNT) || AMOUNT <= 0) {
    throw new Error("CREDIT_AMOUNT must be a positive integer");
  }

  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length === 0) {
    console.log("No users in database; nothing to do.");
    return;
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      data: { balance: { increment: AMOUNT } },
    }),
    prisma.coinTransaction.createMany({
      data: users.map((u) => ({
        userId: u.id,
        amount: AMOUNT,
        type: "ADMIN_GIFT" as const,
        note: NOTE,
      })),
    }),
  ]);

  console.log(`Credited ${AMOUNT} to ${users.length} user(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
