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

export function CreateEventDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [outcomes, setOutcomes] = useState(["", ""]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validOutcomes = outcomes.filter((o) => o.trim());
    if (validOutcomes.length < 2) {
      toast.error("נדרשות לפחות 2 תוצאות");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        closesAt: new Date(closesAt).toISOString(),
        outcomes: validOutcomes,
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
    setTitle("");
    setDescription("");
    setCategory("");
    setClosesAt("");
    setOutcomes(["", ""]);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          צור אירוע חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>צור אירוע חדש</DialogTitle>
        </DialogHeader>
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
          <div className="space-y-1">
            <Label className="text-slate-300">תאריך סגירה</Label>
            <Input
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white"
              dir="ltr"
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
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "יוצר..." : "צור אירוע"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
