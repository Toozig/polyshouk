"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/profile", label: "אירועים שלי" },
  { href: "/profile/bets", label: "הימורים" },
] as const;

export function ProfileTabs() {
  const pathname = usePathname();
  const normalized = pathname.replace(/\/$/, "") || "/";

  return (
    <nav className="flex gap-1 mb-8 border-b border-slate-700" aria-label="פרופיל">
      {tabs.map(({ href, label }) => {
        const isEventsTab = href === "/profile";
        const active = isEventsTab
          ? normalized === "/profile"
          : normalized.startsWith("/profile/bets");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-4 py-2.5 text-sm font-medium rounded-t-lg border border-b-0 -mb-px transition-colors",
              active
                ? "border-slate-600 bg-slate-800 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
