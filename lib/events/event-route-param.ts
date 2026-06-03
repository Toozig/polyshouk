import type { Prisma } from "@/prisma/generated/prisma/client";

/** Map URL segment to a unique Event lookup (numeric → eventNumber, else internal id). */
export function eventWhereUniqueFromRouteSegment(
  segment: string
): Prisma.EventWhereUniqueInput | null {
  if (!segment || segment.length > 256) return null;
  if (/^\d+$/.test(segment)) {
    const n = Number(segment);
    if (!Number.isSafeInteger(n) || n < 1) return null;
    return { eventNumber: n };
  }
  return { id: segment };
}
