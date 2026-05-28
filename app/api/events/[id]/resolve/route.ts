import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { resolveEvent } from "@/lib/events/resolve-event";
import { prisma } from "@/lib/db";

const resolveSchema = z.object({
  outcomeId: z.string().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const body = await request.json();
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { outcomeId } = parsed.data;
  const role = (session.user as { role?: string }).role;
  const isAdmin = role === "ADMIN";

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true, closesAt: true, createdById: true },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const isCreator = event.createdById === session.user.id;
  if (!isAdmin && !isCreator) {
    return NextResponse.json({ error: "גישה נדחתה" }, { status: 403 });
  }

  if (!isAdmin && new Date() < event.closesAt) {
    return NextResponse.json(
      { error: "ניתן לפתור את האירוע רק לאחר תאריך הסגירה" },
      { status: 400 }
    );
  }

  try {
    await resolveEvent(eventId, outcomeId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "EVENT_NOT_FOUND") {
      return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
    }
    if (message === "EVENT_NOT_OPEN") {
      return NextResponse.json(
        { error: "האירוע כבר נסגר או נפתר" },
        { status: 400 }
      );
    }
    if (message === "INVALID_OUTCOME") {
      return NextResponse.json({ error: "תוצאה לא תקינה" }, { status: 400 });
    }
    throw error;
  }

  return NextResponse.json({ resolved: true });
}
