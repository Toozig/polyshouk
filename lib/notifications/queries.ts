import { prisma } from "@/lib/db";
import type {
  NotificationComplaintDetail,
  NotificationItem,
  NotificationMessageDetail,
  NotificationsResponse,
} from "@/lib/notifications/types";

export async function listNotificationsForUser(
  userId: string,
  limit = 50
): Promise<NotificationsResponse> {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        event: { select: { eventNumber: true } },
        complaint: {
          select: {
            id: true,
            body: true,
            reportedUsername: true,
            createdAt: true,
            submitter: { select: { username: true } },
            event: { select: { title: true } },
          },
        },
      },
    }),
    prisma.notification.count({
      where: { userId, readAt: null },
    }),
  ]);

  const messageIds = notifications
    .map((n) => n.messageId)
    .filter((id): id is string => Boolean(id));

  const messagesById = new Map<string, NotificationMessageDetail>();
  if (messageIds.length > 0) {
    const messages = await prisma.directMessage.findMany({
      where: { id: { in: messageIds } },
      select: {
        id: true,
        body: true,
        fromUserId: true,
        fromUser: { select: { username: true } },
      },
    });
    for (const msg of messages) {
      messagesById.set(msg.id, {
        id: msg.id,
        body: msg.body,
        fromUserId: msg.fromUserId,
        fromUsername: msg.fromUser.username,
      });
    }
  }

  const items: NotificationItem[] = notifications.map((n) => {
    let complaint: NotificationComplaintDetail | null = null;
    if (n.complaint) {
      complaint = {
        id: n.complaint.id,
        body: n.complaint.body,
        reportedUsername: n.complaint.reportedUsername,
        submitterUsername: n.complaint.submitter?.username ?? null,
        eventTitle: n.complaint.event?.title ?? null,
        createdAt: n.complaint.createdAt.toISOString(),
      };
    }

    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
      eventNumber: n.event?.eventNumber ?? null,
      message: n.messageId ? (messagesById.get(n.messageId) ?? null) : null,
      complaint,
    };
  });

  return { unreadCount, notifications: items };
}
