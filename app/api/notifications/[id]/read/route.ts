import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
  _req: Request,
  context: RouteContext
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  const { id } = await context.params;
  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { id: true, userId: true, readAt: true, messageId: true },
  });

  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ error: "התראה לא נמצאה" }, { status: 404 });
  }

  if (!notification.readAt) {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.notification.update({
        where: { id },
        data: { readAt: now },
      });
      if (notification.messageId) {
        await tx.directMessage.updateMany({
          where: {
            id: notification.messageId,
            toUserId: session.user!.id,
            readAt: null,
          },
          data: { readAt: now },
        });
      }
    });
  }

  return NextResponse.json({ ok: true });
}
