import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  normalizeUsername,
  usernameSchema,
} from "@/lib/validation/username";

const registerSchema = z.object({
  username: usernameSchema,
  password: z.string().min(6),
  inviteCode: z.string().min(1),
  acceptedTerms: z.literal(true, {
    message: "יש לאשר את התקנון",
  }),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message;
      return NextResponse.json(
        { error: firstIssue ?? "נתונים לא תקינים", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { username, password, inviteCode } = parsed.data;
    const normalizedUsername = normalizeUsername(username);

    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode },
    });

    if (!invite || invite.usedById) {
      return NextResponse.json(
        { error: "קוד הזמנה לא תקין או כבר נוצל" },
        { status: 400 }
      );
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "שם המשתמש כבר תפוס" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: normalizedUsername,
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
  } catch (error) {
    console.error("POST /api/auth/register failed:", error);
    return NextResponse.json(
      { error: "שגיאת שרת. ודא שמסד הנתונים פעיל והגדרות הסביבה תקינות." },
      { status: 500 }
    );
  }
}
