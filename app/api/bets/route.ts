import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { betErrorResponse } from "@/lib/bets/handle-bet-error";
import { placeBet } from "@/lib/bets/place-bet";

const betSchema = z.object({
  eventId: z.string().min(1),
  outcomeId: z.string().min(1),
  amount: z.number().int().positive(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = betSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { eventId, outcomeId, amount } = parsed.data;

  try {
    const bet = await placeBet({
      userId: session.user.id,
      eventId,
      outcomeId,
      amount,
    });
    return NextResponse.json(
      { ...bet, priceAtBet: bet.priceAtBet },
      { status: 201 }
    );
  } catch (error) {
    const response = betErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
