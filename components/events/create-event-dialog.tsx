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
import { Textarea } from "@/components/ui/textarea";
import {
  combineDateAndTime,
  EventClosesAtPicker,
} from "@/components/events/event-closes-at-picker";
import {
  DEFAULT_LIQUIDITY_M,
  EVENT_CLOSES_AT_MAX,
} from "@/lib/constants";
import { formatCoins } from "@/lib/utils";

interface CreateEventDialogProps {
  userBalance: number;
  triggerClassName?: string;
}

export function CreateEventDialog({
  userBalance,
  triggerClassName,
}: CreateEventDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [closeDate, setCloseDate] = useState<Date | undefined>();
  const [closeTime, setCloseTime] = useState("23:59");
  const [outcomes, setOutcomes] = useState(["", ""]);

  const publishPrice = DEFAULT_LIQUIDITY_M;
  const canPublish = userBalance >= publishPrice;

  function addOutcome() {
    setOutcomes((prev) => [...prev, ""]);
  }

  function updateOutcome(index: number, value: string) {
    setOutcomes((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function removeOutcome(index: number) {
    if (outcomes.length <= 2) return;
    setOutcomes((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("");
    setCloseDate(undefined);
    setCloseTime("23:59");
    setOutcomes(["", ""]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validOutcomes = outcomes.filter((o) => o.trim());
    if (validOutcomes.length < 2) {
      toast.error("נדרשות לפחות 2 תוצאות");
      return;
    }

    if (!canPublish) {
      toast.error(
        `מחיר הפרסום ${formatCoins(publishPrice)} — אין יתרה מספקת`
      );
      return;
    }

    if (!closeDate) {
      toast.error("נא לבחור תאריך סגירה");
      return;
    }

    const closesAtDate = combineDateAndTime(closeDate, closeTime);
    const now = new Date();
    if (closesAtDate <= now) {
      toast.error("תאריך הסגירה חייב להיות בעתיד");
      return;
    }
    if (closesAtDate > EVENT_CLOSES_AT_MAX) {
      toast.error("תאריך הסגירה לא יכול להיות אחרי 2 בנובמבר 2026");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        closesAt: closesAtDate.toISOString(),
        outcomes: validOutcomes,
        liquidityM: publishPrice,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "אירעה שגיאה");
      return;
    }

    toast.success("האירוע נוצר בהצלחה!");
    setOpen(false);
    resetForm();
    router.refresh();
    router.push(`/events/${data.eventNumber}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            className={
              triggerClassName ?? "bg-blue-600 hover:bg-blue-700 text-white"
            }
          >
            צור אירוע חדש
          </Button>
        }
      />
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>צור אירוע חדש</DialogTitle>
        </DialogHeader>
        <p className="text-slate-400 text-sm">
          יתרתך:{" "}
          <span className="text-slate-200">{formatCoins(userBalance)}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-slate-300">כותרת</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white text-right"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">תיאור</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white text-right resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">קטגוריה</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white text-right"
            />
          </div>
          <div className="space-y-2 rounded-lg border border-slate-600 bg-slate-900/40 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
              <span className="text-slate-100 text-base font-semibold">
                מחיר הפרסום
              </span>
              <span
                className="text-xl font-bold tabular-nums text-amber-300"
                dir="ltr"
              >
                {formatCoins(publishPrice)}
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              בעת הפרסום ינוכה הסכום מהיתרה והוא ינעל עד לפתרון האירוע. אם
              יישאר עודף בקופת השוק — הוא יחזור אליך.
            </p>
            {!canPublish && (
              <p className="text-red-400 text-sm" role="alert">
                אין יתרה מספקת — נדרשים {formatCoins(publishPrice)} לפרסום.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">תאריך סגירה להימורים</Label>
            <EventClosesAtPicker
              date={closeDate}
              time={closeTime}
              onDateChange={setCloseDate}
              onTimeChange={setCloseTime}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">תוצאות אפשריות</Label>
            {outcomes.map((outcome, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={outcome}
                  onChange={(e) => updateOutcome(index, e.target.value)}
                  placeholder={`תוצאה ${index + 1}`}
                  required
                  className="bg-slate-700 border-slate-600 text-white text-right flex-1"
                />
                {outcomes.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOutcome(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    הסר
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addOutcome}
              className="text-blue-400 hover:text-blue-300"
            >
              + הוסף תוצאה
            </Button>
          </div>
          <Button
            type="submit"
            disabled={loading || !closeDate || !canPublish}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading
              ? "יוצר..."
              : `פרסם — ${formatCoins(publishPrice)}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
