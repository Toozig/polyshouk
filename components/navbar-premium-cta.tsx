"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
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
import { PREMIUM_SUBSCRIPTION_PRICE } from "@/lib/constants";
import { formatCoins } from "@/lib/utils";

type Props = {
  balance: number;
  isPremium: boolean;
};

export function NavbarPremiumCta(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (props.isPremium) {
    return (
      <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-amber-300 border border-amber-500/40 rounded-lg px-2.5 py-1.5 bg-amber-950/30">
        <Sparkles className="size-3.5" aria-hidden />
        פרימיום
      </span>
    );
  }

  const canAfford = props.balance >= PREMIUM_SUBSCRIPTION_PRICE;

  async function subscribe(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch("/api/user/premium", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "לא ניתן להשלים את הרכישה");
        return;
      }
      toast.success("מנוי הפרימיום הופעל בהצלחה");
      setOpen(false);
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-amber-500/50 bg-amber-950/30 text-amber-100 hover:bg-amber-900/40 hover:text-amber-50 gap-1.5"
          >
            <Sparkles className="size-3.5" aria-hidden />
            שדרוג לפרימיום
            <span className="tabular-nums text-amber-200/90">
              ({formatCoins(PREMIUM_SUBSCRIPTION_PRICE)})
            </span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-amber-100">מנוי פרימיום</DialogTitle>
          <DialogDescription className="text-slate-400">
            תובנות נוספות בשוק — תצוגת פוזיציות פתוחות לפי משתמש ותוצאה בכל אירוע
            (למשתמשי פרימיום בלבד). העלות חד־פעמית:{" "}
            <strong className="text-slate-200">
              {formatCoins(PREMIUM_SUBSCRIPTION_PRICE)}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-slate-400">
          יתרה נוכחית:{" "}
          <span className="font-medium text-blue-300 tabular-nums">
            {formatCoins(props.balance)}
          </span>
        </p>
        <DialogFooter className="border-slate-700 bg-slate-900/80">
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
            className="bg-amber-600 hover:bg-amber-500 text-white"
            disabled={!canAfford || loading}
            onClick={() => void subscribe()}
          >
            {loading
              ? "מעבד…"
              : canAfford
                ? "אישור ותשלום"
                : "יתרה לא מספקת"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
