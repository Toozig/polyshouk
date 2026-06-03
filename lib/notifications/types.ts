import type { NotificationType } from "@/prisma/generated/prisma/client";

export type NotificationMessageDetail = {
  id: string;
  body: string;
  fromUserId: string;
  fromUsername: string;
};

export type NotificationComplaintDetail = {
  id: string;
  body: string;
  reportedUsername: string | null;
  submitterUsername: string | null;
  eventTitle: string | null;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
  eventNumber: number | null;
  message: NotificationMessageDetail | null;
  complaint: NotificationComplaintDetail | null;
};

export type NotificationsResponse = {
  unreadCount: number;
  notifications: NotificationItem[];
};
