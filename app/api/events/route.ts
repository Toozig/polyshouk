import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const events = await prisma.event.findMany({
    where: { status: "OPEN" },
    include: {
      outcomes: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { closesAt: "asc" },
  });

  return NextResponse.json(events);
}
