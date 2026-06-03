import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { lmsrBuyCost } from "@/lib/lmsr";
import { getOutcomePrices, marketFromEvent } from "@/lib/market";
import { prisma } from "@/lib/db";
import { eventWhereUniqueFromRouteSegment } from "@/lib/events/event-route-param";

const querySchema = z.object({
  outcome: z.string().optional(),
  shares: z.coerce.number().int().positive().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: segment } = await params;
  const uniqueWhere = eventWhereUniqueFromRouteSegment(segment);
  if (!uniqueWhere) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "פרמטרים לא תקינים", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({
    where: uniqueWhere,
    include: { outcomes: true },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const market = marketFromEvent(event);
  const prices = getOutcomePrices(market);
  const probabilities = event.outcomes.map((_, i) => prices[i]! / 100);

  const body: Record<string, unknown> = {
    market_id: event.id,
    event_number: event.eventNumber,
    status: event.status,
    b_parameter: event.bParameter,
    liquidity_m: event.liquidityM,
    outcomes: event.outcomes.map((o, i) => ({
      id: o.id,
      label: o.label,
      lmsr_q: o.lmsrQ,
      probability: probabilities[i],
      price_cents: prices[i],
    })),
  };

  const { outcome: outcomeId, shares } = parsed.data;
  if (outcomeId && shares) {
    const outcomeIndex = event.outcomes.findIndex((o) => o.id === outcomeId);
    if (outcomeIndex < 0) {
      return NextResponse.json({ error: "תוצאה לא תקינה" }, { status: 400 });
    }

    const qs = event.outcomes.map((o) => o.lmsrQ);
    const calculatedCost = Math.ceil(
      lmsrBuyCost(qs, outcomeIndex, shares, event.bParameter)
    );
    const newQ = [...qs];
    newQ[outcomeIndex]! += shares;
    const newPrices = getOutcomePrices({
      bParameter: event.bParameter,
      liquidityM: event.liquidityM,
      outcomes: newQ.map((lmsrQ) => ({ lmsrQ })),
    });

    body.trade_preview = {
      outcome: outcomeId,
      shares_requested: shares,
      calculated_cost: calculatedCost,
      new_probability: newPrices[outcomeIndex]! / 100,
      status: "pending_confirmation",
    };
  }

  return NextResponse.json(body);
}
