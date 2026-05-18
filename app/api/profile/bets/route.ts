import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id },
    include: {
      event: { select: { id: true, title: true, status: true } },
      outcome: { select: { id: true, label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bets);
}
