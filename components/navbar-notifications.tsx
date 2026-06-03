"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SendMessageDialog } from "@/components/send-message-dialog";
import type { NotificationItem } from "@/lib/notifications/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { UserLink } from "@/components/user/user-link";

type DetailState =
  | { kind: "message"; notification: NotificationItem }
  | { kind: "complaint"; notification: NotificationItem }
  | null;

export function NavbarNotifications() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<DetailState>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as {
        unreadCount: number;
        notifications: NotificationItem[];
      };
      setUnreadCount(data.unreadCount);
      setNotifications(data.notifications);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (open) void fetchNotifications();
  }, [open, fetchNotifications]);

  async function markRead(id: string): Promise<void> {
    const wasUnread = notifications.find((n) => n.id === id && !n.readAt);
    if (!wasUnread) return;

    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleNotificationClick(
    notification: NotificationItem
  ): Promise<void> {
    if (!notification.readAt) {
      await markRead(notification.id);
    }

    if (
      notification.type === "EVENT_RESOLVED_WON" ||
      notification.type === "EVENT_RESOLVED_LOST"
    ) {
      setOpen(false);
      if (notification.eventNumber) {
        router.push(`/events/${notification.eventNumber}`);
      }
      return;
    }

    if (notification.type === "DIRECT_MESSAGE" && notification.message) {
      setDetail({ kind: "message", notification });
      return;
    }

    if (notification.type === "ADMIN_COMPLAINT_NEW" && notification.complaint) {
      setDetail({ kind: "complaint", notification });
    }
  }

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="relative text-slate-300 hover:text-white hover:bg-slate-800"
              aria-label={
                unreadCount > 0
                  ? `התראות — ${unreadCount} שלא נקראו`
                  : "התראות"
              }
            />
          }
        >
          <Bell className="size-4" aria-hidden />
          {badgeLabel ? (
            <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {badgeLabel}
            </span>
          ) : null}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          className="w-80 sm:w-96 max-h-[min(70vh,28rem)] overflow-hidden bg-slate-800 border-slate-700 p-0 text-white"
        >
          <div className="border-b border-slate-700 px-3 py-2.5">
            <p className="font-medium text-sm">התראות</p>
            {unreadCount > 0 ? (
              <p className="text-xs text-slate-400">{unreadCount} שלא נקראו</p>
            ) : null}
          </div>
          <div className="overflow-y-auto max-h-[min(60vh,24rem)]">
            {loading && notifications.length === 0 ? (
              <p className="px-3 py-6 text-sm text-slate-400 text-center">
                טוען…
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-6 text-sm text-slate-400 text-center">
                אין התראות
              </p>
            ) : (
              <ul className="divide-y divide-slate-700">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void handleNotificationClick(n)}
                      className={cn(
                        "w-full text-right px-3 py-3 transition-colors hover:bg-slate-700/60",
                        !n.readAt && "bg-slate-700/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            !n.readAt ? "font-semibold text-white" : "text-slate-200"
                          )}
                        >
                          {n.title}
                        </p>
                        {!n.readAt ? (
                          <span
                            className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-400"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      {n.body ? (
                        <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                          {n.body}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog
        open={detail !== null}
        onOpenChange={(next) => {
          if (!next) setDetail(null);
        }}
      >
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          {detail?.kind === "message" && detail.notification.message ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-right">
                  {detail.notification.title}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                {detail.notification.message.body}
              </p>
              <div className="flex justify-end pt-2">
                <SendMessageDialog
                  toUserId={detail.notification.message.fromUserId}
                  toUsername={detail.notification.message.fromUsername}
                  triggerLabel="השב"
                  onSent={() => setDetail(null)}
                />
              </div>
            </>
          ) : null}
          {detail?.kind === "complaint" && detail.notification.complaint ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-right">תלונה חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {detail.notification.complaint.submitterUsername ? (
                  <p className="text-slate-400">
                    מ:{" "}
                    <UserLink
                      username={detail.notification.complaint.submitterUsername}
                      className="text-slate-200"
                    />
                  </p>
                ) : (
                  <p className="text-slate-400">מ: אנונימי</p>
                )}
                {detail.notification.complaint.reportedUsername ? (
                  <p className="text-slate-400">
                    נגד:{" "}
                    <UserLink
                      username={detail.notification.complaint.reportedUsername}
                      className="text-slate-200"
                    />
                  </p>
                ) : null}
                {detail.notification.complaint.eventTitle ? (
                  <p className="text-slate-400">
                    אירוע:{" "}
                    <span className="text-slate-200">
                      {detail.notification.complaint.eventTitle}
                    </span>
                  </p>
                ) : null}
                <p className="text-slate-300 whitespace-pre-wrap border-t border-slate-700 pt-3">
                  {detail.notification.complaint.body}
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
