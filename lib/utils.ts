import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCoins(amount: number): string {
  return `${amount.toLocaleString("he-IL")} מטבעות`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function calculateOdds(
  outcomeBets: number,
  totalBets: number
): number {
  if (totalBets === 0) return 50;
  return Math.round((outcomeBets / totalBets) * 100);
}
