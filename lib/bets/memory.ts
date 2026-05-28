import { payoutIfWin } from "@/lib/market";
import { BetError, betErrorMessage } from "@/lib/bets/errors";
import { quotePlaceBet, quoteSellShares } from "@/lib/bets/quotes";
import { allocateSellFifo, sumOpenShares } from "@/lib/bets/lots";
import type {
  BetEventContext,
  OpenBetLot,
  PlaceBetParams,
  SellSharesParams,
} from "@/lib/bets/types";

export type MemoryUser = {
  id: string;
  username: string;
  balance: number;
  initialBalance: number;
};

export type MemoryBet = OpenBetLot & {
  shares: number;
  amount: number;
  priceAtBet: number;
  status: "PENDING" | "WON" | "LOST";
  payout?: number;
};

export type MemoryEvent = BetEventContext & {
  resolvedOutcomeId?: string;
};

export type SimState = {
  users: MemoryUser[];
  events: MemoryEvent[];
  bets: MemoryBet[];
  stats: {
    buys: number;
    sells: number;
    skips: number;
  };
};

let betIdCounter = 0;

function nextBetId(): string {
  betIdCounter += 1;
  return `sim-bet-${betIdCounter}`;
}

export function memoryPlaceBet(
  state: SimState,
  params: PlaceBetParams
): MemoryBet {
  const { userId, eventId, outcomeId, amount } = params;
  const event = state.events.find((e) => e.id === eventId);
  if (!event) {
    throw new BetError("EVENT_NOT_FOUND", betErrorMessage("EVENT_NOT_FOUND"));
  }

  const { priceAtBet, shares, cost } = quotePlaceBet(
    event,
    outcomeId,
    amount,
    userId
  );
  const user = state.users.find((u) => u.id === userId);
  if (!user || user.balance < cost) {
    throw new BetError(
      "INSUFFICIENT_BALANCE",
      betErrorMessage("INSUFFICIENT_BALANCE")
    );
  }

  user.balance -= cost;
  event.poolBalance += cost;
  const outcome = event.outcomes.find((o) => o.id === outcomeId);
  if (outcome) {
    outcome.lmsrQ += shares;
  }

  const bet: MemoryBet = {
    id: nextBetId(),
    userId,
    eventId,
    outcomeId,
    amount: cost,
    shares,
    sharesRemaining: shares,
    priceAtBet,
    status: "PENDING",
    createdAt: new Date(),
  };
  state.bets.push(bet);
  state.stats.buys += 1;
  return bet;
}

export function memorySellShares(
  state: SimState,
  params: SellSharesParams
): { proceeds: number; sharesSold: number } {
  const { userId, eventId, outcomeId, shares: sharesToSell } = params;
  const event = state.events.find((e) => e.id === eventId);
  if (!event) {
    throw new BetError("EVENT_NOT_FOUND", betErrorMessage("EVENT_NOT_FOUND"));
  }

  const { proceeds } = quoteSellShares(
    event,
    outcomeId,
    sharesToSell,
    userId
  );
  const openLots = state.bets.filter(
    (b) =>
      b.userId === userId &&
      b.eventId === eventId &&
      b.outcomeId === outcomeId &&
      b.status === "PENDING" &&
      b.sharesRemaining > 0
  );

  const totalHeld = sumOpenShares(openLots, eventId, outcomeId);
  if (totalHeld < sharesToSell) {
    throw new BetError(
      "INSUFFICIENT_SHARES",
      betErrorMessage("INSUFFICIENT_SHARES")
    );
  }

  const allocations = allocateSellFifo(openLots, sharesToSell);
  const user = state.users.find((u) => u.id === userId);
  if (!user) {
    throw new BetError("EVENT_NOT_FOUND", betErrorMessage("EVENT_NOT_FOUND"));
  }

  user.balance += proceeds;
  event.poolBalance -= proceeds;
  const outcome = event.outcomes.find((o) => o.id === outcomeId);
  if (outcome) {
    outcome.lmsrQ -= sharesToSell;
  }

  for (const { lotId, shares } of allocations) {
    const lot = state.bets.find((b) => b.id === lotId);
    if (lot) lot.sharesRemaining -= shares;
  }

  state.stats.sells += 1;
  return { proceeds, sharesSold: sharesToSell };
}

export function memoryResolveEvent(
  state: SimState,
  eventId: string,
  winningOutcomeId: string
): void {
  const event = state.events.find((e) => e.id === eventId);
  if (!event || event.status !== "OPEN") return;

  event.status = "RESOLVED";
  event.resolvedOutcomeId = winningOutcomeId;

  const pending = state.bets.filter(
    (b) =>
      b.eventId === eventId &&
      b.status === "PENDING" &&
      b.sharesRemaining > 0
  );

  let totalPayout = 0;
  for (const bet of pending) {
    if (bet.outcomeId === winningOutcomeId) {
      const payout = payoutIfWin(bet.sharesRemaining);
      bet.status = "WON";
      bet.payout = payout;
      totalPayout += payout;
      const user = state.users.find((u) => u.id === bet.userId);
      if (user) user.balance += payout;
    } else {
      bet.status = "LOST";
      bet.payout = 0;
    }
  }

  event.poolBalance -= totalPayout;
  const creator = state.users.find((u) => u.id === event.createdById);
  if (creator && event.poolBalance > 0) {
    creator.balance += event.poolBalance;
    event.poolBalance = 0;
  }
}
