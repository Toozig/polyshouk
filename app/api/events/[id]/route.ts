import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { eventWhereUniqueFromRouteSegment } from "@/lib/events/event-route-param";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: segment } = await params;
  const uniqueWhere = eventWhereUniqueFromRouteSegment(segment);
  if (!uniqueWhere) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const event = await prisma.event.findUnique({
    where: uniqueWhere,
    include: {
      outcomes: true,
      createdBy: { select: { id: true, username: true } },
      _count: { select: { bets: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  return NextResponse.json(event);
}
