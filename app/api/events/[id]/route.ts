import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      outcomes: true,
      createdBy: { select: { id: true, name: true } },
      _count: { select: { bets: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  return NextResponse.json(event);
}
