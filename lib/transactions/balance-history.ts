import { prisma } from "@/lib/db";
import type { CoinTransaction } from "@/prisma/generated/prisma/client";
import type { TransactionType } from "@/prisma/generated/prisma/enums";

const TYPE_FALLBACK: Record<TransactionType, string> = {
  ADMIN_ADJUSTMENT: "עדכון יתרה על ידי מנהל",
  ADMIN_GIFT: "זיכוי מהמערכת",
  BET_PLACED: "הימור",
  BET_SOLD: "מכירת מניות",
  BET_WON: "זכייה בהימור",
  EVENT_CREATED: "תשלום לפרסום אירוע",
  EVENT_LIQUIDITY_RETURN: "תשלום מסיום אירוע (החזר נזילות)",
  INITIAL_GRANT: "מענק פתיחה",
  PREMIUM_PURCHASE: "מנוי פרימיום",
};

export type BalanceHistoryRow = {
  id: string;
  createdAt: Date;
  amount: number;
  reason: string;
  eventHref: string | null;
  eventTitle: string | null;
};

const EVENT_LINK_TYPES: TransactionType[] = [
  "EVENT_CREATED",
  "EVENT_LIQUIDITY_RETURN",
  "BET_PLACED",
  "BET_SOLD",
  "BET_WON",
];

function eventLinkFromId(
  eventId: string | null | undefined,
  map: Map<string, { eventNumber: number; title: string }>
): { href: string; title: string } | null {
  if (!eventId) return null;
  const ev = map.get(eventId);
  if (!ev) return null;
  return { href: `/events/${ev.eventNumber}`, title: ev.title };
}

/** Resolve event links for profile balance history (numeric /events URLs). */
export async function buildBalanceHistoryRows(
  transactions: CoinTransaction[],
  limit = 200
): Promise<BalanceHistoryRow[]> {
  const txs = transactions.slice(0, limit);

  const betIds = txs
    .filter(
      (t) =>
        (t.type === "BET_PLACED" || t.type === "BET_WON") && t.referenceId
    )
    .map((t) => t.referenceId as string);

  const directEventRefIds = txs
    .filter(
      (t) =>
        (t.type === "EVENT_CREATED" ||
          t.type === "EVENT_LIQUIDITY_RETURN" ||
          t.type === "BET_SOLD") &&
        t.referenceId
    )
    .map((t) => t.referenceId as string);

  const bets =
    betIds.length > 0
      ? await prisma.bet.findMany({
          where: { id: { in: [...new Set(betIds)] } },
          select: {
            id: true,
            eventId: true,
            event: { select: { id: true, eventNumber: true, title: true } },
          },
        })
      : [];

  const betIdToEvent = new Map(
    bets.map((b) => [b.id, b.event] as const)
  );

  const eventById = new Map<
    string,
    { eventNumber: number; title: string }
  >();
  for (const b of bets) {
    eventById.set(b.event.id, b.event);
  }

  const missingForDirect = directEventRefIds.filter((id) => !eventById.has(id));
  if (missingForDirect.length > 0) {
    const extra = await prisma.event.findMany({
      where: { id: { in: [...new Set(missingForDirect)] } },
      select: { id: true, eventNumber: true, title: true },
    });
    for (const e of extra) {
      eventById.set(e.id, e);
    }
  }

  return txs.map((tx) => {
    const reason = tx.note?.trim() || TYPE_FALLBACK[tx.type];

    let link: { href: string; title: string } | null = null;
    if (EVENT_LINK_TYPES.includes(tx.type)) {
      if (tx.type === "BET_PLACED" || tx.type === "BET_WON") {
        const ev = tx.referenceId ? betIdToEvent.get(tx.referenceId) : undefined;
        link = ev
          ? { href: `/events/${ev.eventNumber}`, title: ev.title }
          : null;
      } else {
        link = eventLinkFromId(tx.referenceId, eventById);
      }
    }

    return {
      id: tx.id,
      createdAt: tx.createdAt,
      amount: tx.amount,
      reason,
      eventHref: link?.href ?? null,
      eventTitle: link?.title ?? null,
    };
  });
}
