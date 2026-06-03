import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PREMIUM_SUBSCRIPTION_PRICE } from "@/lib/constants";

/**
 * Self-service: debit balance once and set `isPremium` (insights on events).
 */
export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  const userId = session.user.id;
  const price = PREMIUM_SUBSCRIPTION_PRICE;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true, isPremium: true },
      });
      if (!user) {
        throw new Error("NOT_FOUND");
      }
      if (user.isPremium) {
        throw new Error("ALREADY_PREMIUM");
      }
      if (user.balance < price) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: price },
          isPremium: true,
        },
        select: { id: true, balance: true, isPremium: true },
      });

      await tx.coinTransaction.create({
        data: {
          userId,
          amount: -price,
          type: "PREMIUM_PURCHASE",
          note: `מנוי פרימיום (${price} ערך)`,
        },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND") {
        return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
      }
      if (e.message === "ALREADY_PREMIUM") {
        return NextResponse.json(
          { error: "כבר יש לך מנוי פרימיום" },
          { status: 400 }
        );
      }
      if (e.message === "INSUFFICIENT_BALANCE") {
        return NextResponse.json(
          {
            error: `יתרה לא מספקת — נדרשים לפחות ${price} ערך`,
          },
          { status: 400 }
        );
      }
    }
    throw e;
  }
}
