import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const giftSchema = z.object({
  amount: z.number().int().positive(),
  note: z.string().optional(),
});

export async function POST(
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
  const parsed = giftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { amount, note } = parsed.data;

  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
      select: { id: true, username: true, balance: true },
    });

    await tx.coinTransaction.create({
      data: {
        userId,
        amount,
        type: "ADMIN_GIFT",
        note: note ?? "מתנה מהמנהל",
      },
    });

    return user;
  });

  return NextResponse.json(updatedUser);
}
