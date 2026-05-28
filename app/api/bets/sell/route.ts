import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { betErrorResponse } from "@/lib/bets/handle-bet-error";
import { sellShares } from "@/lib/bets/sell-shares";

const sellSchema = z.object({
  eventId: z.string().min(1),
  outcomeId: z.string().min(1),
  shares: z.number().int().positive(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = sellSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { eventId, outcomeId, shares } = parsed.data;

  try {
    const result = await sellShares({
      userId: session.user.id,
      eventId,
      outcomeId,
      shares,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const response = betErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
