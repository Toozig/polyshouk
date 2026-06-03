import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const setBalanceSchema = z.object({
  balance: z.number().int().min(0),
  note: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "גישה נדחתה" }, { status: 403 });
  }

  const { id: userId } = await params;
  const body = await request.json();
  const parsed = setBalanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { balance: targetBalance, note } = parsed.data;

  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, balance: true },
      });
      if (!before) {
        throw new Error("NOT_FOUND");
      }

      const delta = targetBalance - before.balance;
      if (delta === 0) {
        return before;
      }

      const user = await tx.user.update({
        where: { id: userId },
        data: { balance: targetBalance },
        select: { id: true, username: true, balance: true },
      });

      await tx.coinTransaction.create({
        data: {
          userId,
          amount: delta,
          type: "ADMIN_ADJUSTMENT",
          note:
            note?.trim() ||
            `עדכון יתרה על ידי מנהל: ${before.balance} → ${targetBalance}`,
        },
      });

      return user;
    });

    return NextResponse.json(updatedUser);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
    }
    throw e;
  }
}
