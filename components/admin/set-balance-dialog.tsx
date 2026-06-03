"use client";

import { useEffect, useState } from "react";
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
import { CURRENCY_NAME } from "@/lib/constants";

interface SetBalanceDialogProps {
  userId: string;
  userName: string;
  currentBalance: number;
}

export function SetBalanceDialog({
  userId,
  userName,
  currentBalance,
}: SetBalanceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(currentBalance);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setBalance(currentBalance);
  }, [open, currentBalance]);

  async function handleSave() {
    if (balance < 0 || !Number.isInteger(balance)) return;
    setLoading(true);

    const response = await fetch(`/api/admin/users/${userId}/balance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance, note: note || undefined }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "אירעה שגיאה");
      return;
    }

    toast.success(`יתרת ${userName} עודכנה ל-${balance} ${CURRENCY_NAME}`);
    setOpen(false);
    setNote("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-slate-500 text-slate-200 hover:bg-slate-700/50"
          >
            ערוך יתרה
          </Button>
        }
      />
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>יתרת {CURRENCY_NAME} ל-{userName}</DialogTitle>
        </DialogHeader>
        <p className="text-slate-400 text-sm">
          יתרה נוכחית: <span dir="ltr">{currentBalance}</span>
        </p>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-slate-300">יתרה חדשה ({CURRENCY_NAME})</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={balance}
              onChange={(e) => {
              const raw = e.target.value;
              setBalance(raw === "" ? 0 : Number(raw));
            }}
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
              placeholder="סיבה לשינוי..."
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={
              loading ||
              !Number.isFinite(balance) ||
              balance < 0 ||
              !Number.isInteger(balance)
            }
            className="w-full bg-slate-600 hover:bg-slate-500"
          >
            {loading ? "שומר..." : "שמור יתרה"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
