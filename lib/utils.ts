import { clsx, type ClassValue } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import { CURRENCY_NAME } from "@/lib/constants";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCoins(amount: number): string {
  return `${amount.toLocaleString("he-IL")} ${CURRENCY_NAME}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: he,
  });
}

