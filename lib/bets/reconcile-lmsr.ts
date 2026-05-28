import { prisma } from "@/lib/db";

/**
 * qᵢ should equal m + aggregate open shares on outcome i.
 * Repairs rows drifted after migration or manual DB edits.
 */
export async function reconcileEventLmsrQ(eventId: string): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      outcomes: true,
      bets: {
        where: { status: "PENDING", sharesRemaining: { gt: 0 } },
        select: { outcomeId: true, sharesRemaining: true },
      },
    },
  });

  if (!event) return;

  const heldByOutcome = new Map<string, number>();
  for (const bet of event.bets) {
    heldByOutcome.set(
      bet.outcomeId,
      (heldByOutcome.get(bet.outcomeId) ?? 0) + bet.sharesRemaining
    );
  }

  for (const outcome of event.outcomes) {
    const held = heldByOutcome.get(outcome.id) ?? 0;
    const expectedQ = event.liquidityM + held;
    if (outcome.lmsrQ < expectedQ) {
      await prisma.outcome.update({
        where: { id: outcome.id },
        data: { lmsrQ: expectedQ },
      });
      outcome.lmsrQ = expectedQ;
    }
  }
}
