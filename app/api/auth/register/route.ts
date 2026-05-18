import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  inviteCode: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, inviteCode } = parsed.data;

  const invite = await prisma.inviteCode.findUnique({
    where: { code: inviteCode },
  });

  if (!invite || invite.usedById) {
    return NextResponse.json(
      { error: "קוד הזמנה לא תקין או כבר נוצל" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "כתובת האימייל כבר רשומה במערכת" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        balance: 1000,
      },
    });

    await tx.inviteCode.update({
      where: { id: invite.id },
      data: { usedById: user.id, usedAt: new Date() },
    });

    await tx.coinTransaction.create({
      data: {
        userId: user.id,
        amount: 1000,
        type: "INITIAL_GRANT",
        note: "מענק פתיחה לחשבון חדש",
      },
    });
  });

  return NextResponse.json({ success: true });
}
