"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ComplaintBanner() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [eventId, setEventId] = useState("");
  const [reportedUsername, setReportedUsername] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          eventId: eventId.trim() || undefined,
          reportedUsername: reportedUsername.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("יש להתחבר לפני שליחת תלונה");
        } else {
          toast.error(data.error ?? "שגיאה בשליחה");
        }
        return;
      }
      toast.success("התלונה נשלחה. תודה.");
      setBody("");
      setEventId("");
      setReportedUsername("");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-yellow-400 text-yellow-950 border-b border-yellow-500 px-3 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:justify-between">
        <p className="text-sm font-medium text-center sm:text-right">
          יש בעיה, הערה או תלונה? אפשר לשלוח לנו בטופס — נבדוק בקרוב.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-yellow-800 bg-yellow-300 text-yellow-950 hover:bg-yellow-200"
              >
                טופס תלונה
              </Button>
            }
          />
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-right">שליחת תלונה / דיווח</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-slate-300">תוכן התלונה</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={6}
                  placeholder="תאר את הבעיה בחופשיות..."
                  className="bg-slate-700 border-slate-600 text-white text-right resize-none min-h-[140px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">מזהה אירוע (אופציונלי)</Label>
                <Input
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="מספר מהכתובת /events/123 או מזהה ארוך מהקישור הישן"
                  className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">שם משתמש מדווח (אופציונלי)</Label>
                <Input
                  value={reportedUsername}
                  onChange={(e) => setReportedUsername(e.target.value)}
                  placeholder="אם רלוונטי — שם משתמש באתר"
                  className="bg-slate-700 border-slate-600 text-white text-right"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !body.trim()}
                className="w-full bg-yellow-500 text-yellow-950 hover:bg-yellow-400"
              >
                {loading ? "שולח..." : "שלח"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
