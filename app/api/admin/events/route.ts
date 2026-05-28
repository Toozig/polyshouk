import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "גישה נדחתה" }, { status: 403 });
  }

  const events = await prisma.event.findMany({
    include: {
      outcomes: true,
      createdBy: { select: { id: true, username: true } },
      resolvedOutcome: true,
      _count: { select: { bets: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(events);
}
