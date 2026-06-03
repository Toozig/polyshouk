"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type EventListSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function EventListSearchBar({
  value,
  onChange,
  className,
}: EventListSearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="חיפוש אירועים…"
        className="bg-slate-900 border-slate-600 text-white pr-10"
        aria-label="חיפוש אירועים"
      />
    </div>
  );
}
