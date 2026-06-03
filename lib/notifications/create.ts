import { prisma } from "@/lib/db";

function truncatePreview(text: string, max = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export async function notifyAdminsNewComplaint(
  complaintId: string,
  body: string,
  submitterUsername?: string
): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (admins.length === 0) return;

  const title = submitterUsername
    ? `תלונה מ-${submitterUsername}`
    : "תלונה חדשה";

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: "ADMIN_COMPLAINT_NEW" as const,
      title,
      body: truncatePreview(body),
      complaintId,
    })),
  });
}

export async function notifyDirectMessage(
  messageId: string,
  toUserId: string,
  fromUsername: string,
  body: string
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: toUserId,
      type: "DIRECT_MESSAGE",
      title: `הודעה מ-${fromUsername}`,
      body: truncatePreview(body),
      messageId,
    },
  });
}
