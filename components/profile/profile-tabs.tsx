"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const baseTabs = [
  { href: "/profile", label: "אירועים שלי", match: (p: string) => p === "/profile" },
  { href: "/profile/bets", label: "הימורים", match: (p: string) => p.startsWith("/profile/bets") },
  {
    href: "/profile/history",
    label: "היסטוריית ערכים",
    match: (p: string) => p.startsWith("/profile/history"),
  },
] as const;

const adminTab = {
  href: "/profile/admin",
  label: "מנהל",
  match: (p: string) => p.startsWith("/profile/admin"),
} as const;

export function ProfileTabs({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const normalized = pathname.replace(/\/$/, "") || "/";

  const tabs = isAdmin ? [...baseTabs, adminTab] : [...baseTabs];

  return (
    <nav className="flex gap-1 mb-8 border-b border-slate-700" aria-label="פרופיל">
      {tabs.map(({ href, label, match }) => {
        const active = match(normalized);
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
