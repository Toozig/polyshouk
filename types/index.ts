import type {
  User,
  Event,
  Outcome,
  Bet,
  CoinTransaction,
  InviteCode,
} from "@/prisma/generated/prisma/client";

export type { User, Event, Outcome, Bet, CoinTransaction, InviteCode };

export type { BetStatus } from "@/prisma/generated/prisma/enums";

export type EventWithOutcomes = Event & {
  outcomes: Outcome[];
  createdBy: Pick<User, "id" | "name">;
};

export type BetWithDetails = Bet & {
  event: Pick<Event, "id" | "title" | "status">;
  outcome: Pick<Outcome, "id" | "label">;
};

export type UserWithStats = User & {
  _count: { bets: number };
};
