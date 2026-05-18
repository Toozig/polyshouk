import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "גישה נדחתה" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      balance: true,
      createdAt: true,
      _count: { select: { bets: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}
