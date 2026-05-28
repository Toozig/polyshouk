import type { LmsrOutcomeState } from "@/lib/market";

export type BetEventOutcome = LmsrOutcomeState & {
  id: string;
  label: string;
};

export type BetEventContext = {
  id: string;
  title: string;
  status: string;
  closesAt: Date;
  createdById: string;
  bParameter: number;
  liquidityM: number;
  poolBalance: number;
  outcomes: BetEventOutcome[];
};

export type OpenBetLot = {
  id: string;
  userId: string;
  eventId: string;
  outcomeId: string;
  sharesRemaining: number;
  createdAt: Date;
};

export type PlaceBetParams = {
  userId: string;
  eventId: string;
  outcomeId: string;
  amount: number;
};

export type SellSharesParams = {
  userId: string;
  eventId: string;
  outcomeId: string;
  shares: number;
};
