import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyDirectMessage } from "@/lib/notifications/create";

const bodySchema = z.object({
  toUserId: z.string().cuid(),
  body: z.string().trim().min(1, "נא למלא את ההודעה").max(5000),
});

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה לא תקין" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.body?.[0] ??
      parsed.error.flatten().fieldErrors.toUserId?.[0] ??
      "נתונים לא תקינים";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { toUserId, body } = parsed.data;
  if (toUserId === session.user.id) {
    return NextResponse.json(
      { error: "לא ניתן לשלוח הודעה לעצמך" },
      { status: 400 }
    );
  }

  const recipient = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { id: true },
  });
  if (!recipient) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  const sender = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });
  if (!sender) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  const message = await prisma.directMessage.create({
    data: {
      fromUserId: session.user.id,
      toUserId,
      body,
    },
    select: { id: true },
  });

  await notifyDirectMessage(
    message.id,
    toUserId,
    sender.username,
    body
  );

  return NextResponse.json({ ok: true, id: message.id });
}
