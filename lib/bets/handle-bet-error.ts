import { NextResponse } from "next/server";
import { BetError } from "@/lib/bets/errors";

const STATUS_BY_CODE: Record<string, number> = {
  UNAUTHORIZED: 401,
  INVALID_INPUT: 400,
  EVENT_NOT_FOUND: 404,
  EVENT_NOT_OPEN: 400,
  BETTING_CLOSED: 400,
  INVALID_OUTCOME: 400,
  AMOUNT_TOO_LOW: 400,
  INSUFFICIENT_BALANCE: 400,
  INSUFFICIENT_SHARES: 400,
  PROCEEDS_TOO_LOW: 400,
};

export function betErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof BetError)) return null;
  const status = STATUS_BY_CODE[error.code] ?? 400;
  return NextResponse.json({ error: error.message }, { status });
}
