import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeUsername, usernameSchema } from "@/lib/validation/username";

const bodySchema = z.object({
  body: z.string().trim().min(1, "נא למלא את תוכן התלונה").max(5000),
  eventId: z.string().trim().optional(),
  reportedUsername: z.string().optional(),
});

export async function POST(req: Request) {
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

  const session = await auth();
  const submitterId = session?.user?.id ?? undefined;

  await prisma.complaint.create({
    data: {
      body,
      eventId: eventId ?? null,
      reportedUsername: reportedUsername ?? null,
      submitterId: submitterId ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
