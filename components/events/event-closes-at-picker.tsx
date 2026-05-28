"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EVENT_CLOSES_AT_MAX } from "@/lib/constants";
import { cn } from "@/lib/utils";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

interface EventClosesAtPickerProps {
  date: Date | undefined;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  className?: string;
}

export function EventClosesAtPicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  className,
}: EventClosesAtPickerProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDay = useMemo(() => startOfDay(EVENT_CLOSES_AT_MAX), []);

  const label = date
    ? format(combineDateAndTime(date, time), "d MMMM yyyy, HH:mm", {
        locale: he,
      })
    : "בחר תאריך ושעה";

  return (
    <div className={cn("space-y-2", className)}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-right font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white",
                !date && "text-slate-400"
              )}
            />
          }
        >
          <CalendarIcon className="ml-2 size-4 opacity-70" />
          {label}
        </PopoverTrigger>
        <PopoverContent
          className="w-auto bg-slate-800 border-slate-700 p-0"
          align="start"
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            locale={he}
            dir="rtl"
            disabled={{ before: today, after: maxDay }}
            defaultMonth={date ?? today}
            className="rounded-lg"
          />
        </PopoverContent>
      </Popover>
      <div className="space-y-1">
        <Label className="text-slate-400 text-xs">שעת סגירה</Label>
        <Input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          required
          className="bg-slate-700 border-slate-600 text-white"
          dir="ltr"
        />
      </div>
      <p className="text-slate-500 text-xs">
        עד {format(EVENT_CLOSES_AT_MAX, "d MMMM yyyy", { locale: he })} · לאחר מכן
        תוכל לבחור את התוצאה המנצחת
      </p>
    </div>
  );
}
