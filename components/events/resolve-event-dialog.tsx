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
import type { Outcome } from "@/types";

interface ResolveEventDialogProps {
  eventId: string;
  eventTitle: string;
  outcomes: Outcome[];
  canResolve: boolean;
  resolveBlockedReason?: string;
}

export function ResolveEventDialog({
  eventId,
  eventTitle,
  outcomes,
  canResolve,
  resolveBlockedReason,
}: ResolveEventDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>(
    outcomes[0]?.id ?? ""
  );
  const [loading, setLoading] = useState(false);

  async function handleResolve() {
    if (!selectedOutcomeId) return;
    setLoading(true);

    const response = await fetch(`/api/events/${eventId}/resolve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcomeId: selectedOutcomeId }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "אירעה שגיאה");
      return;
    }

    toast.success("האירוע נפתר בהצלחה!");
    setOpen(false);
    router.refresh();
  }

  if (!canResolve) {
    if (!resolveBlockedReason) return null;
    return (
      <p className="text-yellow-400 text-sm">{resolveBlockedReason}</p>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          variant="outline"
          size="sm"
          className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
        >
          פתור אירוע
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>פתרון אירוע</DialogTitle>
        </DialogHeader>
        <p className="text-slate-400 text-sm">{eventTitle}</p>
        <p className="text-slate-500 text-xs">
          בחר את התוצאה המנצחת. לאחר האישור יחולקו הזכיות למנצחים.
        </p>
        <div className="space-y-2 my-4">
          <p className="text-slate-300 text-sm font-medium">
            בחר את התוצאה המנצחת:
          </p>
          {outcomes.map((outcome) => (
            <button
              key={outcome.id}
              type="button"
              onClick={() => setSelectedOutcomeId(outcome.id)}
              className={`w-full p-3 rounded-lg border text-right transition-colors ${
                selectedOutcomeId === outcome.id
                  ? "border-green-500 bg-green-600/20 text-white"
                  : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              {outcome.label}
            </button>
          ))}
        </div>
        <Button
          onClick={handleResolve}
          disabled={loading || !selectedOutcomeId}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? "מעבד..." : "אשר פתרון"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
