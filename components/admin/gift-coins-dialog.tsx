"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface GiftCoinsDialogProps {
  userId: string;
  userName: string;
}

export function GiftCoinsDialog({ userId, userName }: GiftCoinsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(100);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGift() {
    if (amount <= 0) return;
    setLoading(true);

    const response = await fetch(`/api/admin/users/${userId}/gift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, note: note || undefined }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "אירעה שגיאה");
      return;
    }

    toast.success(`נשלחו ${amount} מטבעות ל-${userName}`);
    setOpen(false);
    setAmount(100);
    setNote("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          variant="outline"
          size="sm"
          className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
        >
          תן מטבעות
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>שלח מטבעות ל-{userName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-slate-300">כמות מטבעות</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bg-slate-700 border-slate-600 text-white"
              dir="ltr"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">הערה (אופציונלי)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white text-right"
              placeholder="סיבה למתנה..."
            />
          </div>
          <Button
            onClick={handleGift}
            disabled={loading || amount <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "שולח..." : "שלח מטבעות"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
