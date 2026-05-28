import { lmsrMaxSellableShares } from "@/lib/lmsr";
import {
  marketFromEvent,
  qsFromMarket,
  quoteBuyByAmount,
  quoteSell,
} from "@/lib/market";
import { BetError, betErrorMessage } from "@/lib/bets/errors";
import type { BetEventContext } from "@/lib/bets/types";

export type PlaceBetQuote = {
  priceAtBet: number;
  shares: number;
  cost: number;
  outcomeIndex: number;
};

export type SellSharesQuote = {
  priceCents: number;
  proceeds: number;
};

export function assertEventOpenForBetting(
  event: BetEventContext,
  now: Date = new Date()
): void {
  if (event.status !== "OPEN") {
    throw new BetError("EVENT_NOT_OPEN", betErrorMessage("EVENT_NOT_OPEN"));
  }
  if (now >= event.closesAt) {
    throw new BetError("BETTING_CLOSED", betErrorMessage("BETTING_CLOSED"));
  }
}

export function assertNotMarketCreator(
  event: BetEventContext,
  userId: string
): void {
  if (event.createdById === userId) {
    throw new BetError(
      "CREATOR_CANNOT_TRADE",
      betErrorMessage("CREATOR_CANNOT_TRADE")
    );
  }
}

export function quotePlaceBet(
  event: BetEventContext,
  outcomeId: string,
  amount: number,
  userId?: string
): PlaceBetQuote {
  assertEventOpenForBetting(event);
  if (userId) assertNotMarketCreator(event, userId);

  const outcomeIndex = event.outcomes.findIndex((o) => o.id === outcomeId);
  if (outcomeIndex < 0) {
    throw new BetError("INVALID_OUTCOME", betErrorMessage("INVALID_OUTCOME"));
  }

  const market = marketFromEvent(event);
  const { shares, cost, priceCents } = quoteBuyByAmount(
    market,
    outcomeIndex,
    amount
  );

  if (shares < 1) {
    throw new BetError("AMOUNT_TOO_LOW", betErrorMessage("AMOUNT_TOO_LOW"));
  }

  if (cost > amount) {
    throw new BetError("AMOUNT_TOO_LOW", betErrorMessage("AMOUNT_TOO_LOW"));
  }

  return { priceAtBet: priceCents, shares, cost, outcomeIndex };
}

export function quoteSellShares(
  event: BetEventContext,
  outcomeId: string,
  shares: number,
  userId?: string
): SellSharesQuote {
  assertEventOpenForBetting(event);
  if (userId) assertNotMarketCreator(event, userId);

  const outcomeIndex = event.outcomes.findIndex((o) => o.id === outcomeId);
  if (outcomeIndex < 0) {
    throw new BetError("INVALID_OUTCOME", betErrorMessage("INVALID_OUTCOME"));
  }

  if (shares < 1) {
    throw new BetError("INVALID_INPUT", betErrorMessage("INVALID_INPUT"));
  }

  const market = marketFromEvent(event);
  const maxFromMarket = lmsrMaxSellableShares(
    qsFromMarket(market),
    outcomeIndex,
    event.liquidityM
  );
  if (shares > maxFromMarket) {
    throw new BetError(
      "INSUFFICIENT_MARKET_LIQUIDITY",
      betErrorMessage("INSUFFICIENT_MARKET_LIQUIDITY")
    );
  }

  const { proceeds, priceCents } = quoteSell(market, outcomeIndex, shares);

  if (proceeds < 1) {
    throw new BetError("PROCEEDS_TOO_LOW", betErrorMessage("PROCEEDS_TOO_LOW"));
  }

  return { priceCents, proceeds };
}
