"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { UserLink } from "@/components/user/user-link";

type Props = {
  toUserId: string;
  toUsername: string;
  triggerLabel?: string;
  onSent?: () => void;
};

export function SendMessageDialog({
  toUserId,
  toUsername,
  triggerLabel = "שליחת הודעה",
  onSent,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(): Promise<void> {
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error("נא למלא את ההודעה");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, body: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "שגיאה בשליחה");
        return;
      }
      toast.success("ההודעה נשלחה");
      setBody("");
      setOpen(false);
      onSent?.();
      router.refresh();
    } catch {
      toast.error("שגיאת רשת — נסו שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">שליחת הודעה</DialogTitle>
          <DialogDescription className="text-slate-400 text-right">
            אל <UserLink username={toUsername} className="text-slate-300" />
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="תוכן ההודעה…"
          rows={5}
          className="bg-slate-700 border-slate-600 text-white resize-none"
          maxLength={5000}
        />
        <DialogFooter className="border-slate-700">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={() => void send()}
            disabled={loading || !body.trim()}
          >
            {loading ? "שולח…" : "שליחה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
