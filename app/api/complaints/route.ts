import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyAdminsNewComplaint } from "@/lib/notifications/create";
import { normalizeUsername, usernameSchema } from "@/lib/validation/username";

const bodySchema = z.object({
  body: z.string().trim().min(1, "נא למלא את תוכן התלונה").max(5000),
  eventId: z.string().trim().optional(),
  reportedUsername: z.string().optional(),
});

function complaintBodyWithSubmitter(submitterUsername: string, body: string): string {
  const prefix = `מאת: ${submitterUsername}\n\n`;
  if (body.startsWith(prefix)) return body;
  return `${prefix}${body}`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות לשליחת תלונה" }, { status: 401 });
  }

  const submitterId = session.user.id;
  const submitterUsername =
    session.user.name?.trim() ??
    (
      await prisma.user.findUnique({
        where: { id: submitterId },
        select: { username: true },
      })
    )?.username;

  if (!submitterUsername) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה לא תקין" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.body?.[0] ?? "נתונים לא תקינים";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { body } = parsed.data;
  const eventIdRaw = parsed.data.eventId?.trim() ?? "";
  const reportedRaw = parsed.data.reportedUsername?.trim() ?? "";

  let eventId: string | undefined;
  if (eventIdRaw) {
    if (!z.string().cuid().safeParse(eventIdRaw).success) {
      return NextResponse.json({ error: "מזהה אירוע לא תקין" }, { status: 400 });
    }
    const ev = await prisma.event.findUnique({
      where: { id: eventIdRaw },
      select: { id: true },
    });
    if (!ev) {
      return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 400 });
    }
    eventId = ev.id;
  }

  let reportedUsername: string | undefined;
  if (reportedRaw) {
    const normalized = normalizeUsername(reportedRaw);
    const u = usernameSchema.safeParse(normalized);
    if (!u.success) {
      const first = u.error.flatten().formErrors[0] ?? "שם משתמש לא תקין";
      return NextResponse.json({ error: first }, { status: 400 });
    }
    reportedUsername = normalized;
  }

  const storedBody = complaintBodyWithSubmitter(submitterUsername, body);

  const complaint = await prisma.complaint.create({
    data: {
      body: storedBody,
      eventId: eventId ?? null,
      reportedUsername: reportedUsername ?? null,
      submitterId,
    },
    select: { id: true },
  });

  await notifyAdminsNewComplaint(complaint.id, storedBody, submitterUsername);

  return NextResponse.json({ ok: true });
}
