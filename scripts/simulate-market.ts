/**
 * In-memory LMSR market simulation: 100 users, 4 events, random buy/sell activity.
 * Does not touch the database.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { BetError } from "../lib/bets/errors";
import {
  memoryPlaceBet,
  memoryResolveEvent,
  memorySellShares,
  type MemoryEvent,
  type SimState,
} from "../lib/bets/memory";
import { defaultBForEvent } from "../lib/market";
import { getOutcomePrices, marketFromEvent } from "../lib/market";

const USER_COUNT = 100;
const INITIAL_BALANCE = 1000;
const ROUNDS = 8000;
const SEED = 42;
const SKIP_CHANCE = 0.25;
const BUY_CHANCE = 0.55;
const DEFAULT_M = 100;

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function makeEvent(
  id: string,
  title: string,
  labels: string[],
  creatorId: string,
  m: number = DEFAULT_M
): MemoryEvent {
  const b = defaultBForEvent(m, labels.length);
  return {
    id,
    title,
    status: "OPEN",
    closesAt: new Date("2026-12-31T23:59:59Z"),
    createdById: creatorId,
    liquidityM: m,
    bParameter: b,
    poolBalance: m,
    outcomes: labels.map((label, i) => ({
      id: `${id}-o${i}`,
      label,
      lmsrQ: m,
    })),
  };
}

function buildInitialState(): SimState {
  const users = Array.from({ length: USER_COUNT }, (_, i) => {
    const n = String(i + 1).padStart(3, "0");
    return {
      id: `bot_${n}`,
      username: `bot_${n}`,
      balance: INITIAL_BALANCE,
      initialBalance: INITIAL_BALANCE,
    };
  });

  const houseId = "house_creator";

  const events: MemoryEvent[] = [
    makeEvent(
      "sim-ev-1",
      "Will Bitcoin trade above $150,000 by Dec 31, 2026?",
      ["Yes", "No"],
      houseId
    ),
    makeEvent(
      "sim-ev-2",
      "Will Israel win Eurovision 2027?",
      ["Yes", "No"],
      houseId
    ),
    makeEvent("sim-ev-3", "Who will win the Israeli Premier League 2025/26?", [
      "Maccabi Tel Aviv",
      "Hapoel Beer Sheva",
      "Hapoel Tel Aviv",
    ], houseId),
    makeEvent(
      "sim-ev-4",
      "Will the Bank of Israel raise interest rates in 2026?",
      ["Yes", "No"],
      houseId
    ),
  ];

  return {
    users,
    events,
    bets: [],
    stats: { buys: 0, sells: 0, skips: 0 },
  };
}

function openSharesForUser(
  state: SimState,
  userId: string,
  eventId: string,
  outcomeId: string
): number {
  return state.bets
    .filter(
      (b) =>
        b.userId === userId &&
        b.eventId === eventId &&
        b.outcomeId === outcomeId &&
        b.status === "PENDING" &&
        b.sharesRemaining > 0
    )
    .reduce((s, b) => s + b.sharesRemaining, 0);
}

function runSimulation(state: SimState, rng: () => number): void {
  for (let round = 0; round < ROUNDS; round++) {
    if (rng() < SKIP_CHANCE) {
      state.stats.skips += 1;
      continue;
    }

    const user = pick(rng, state.users);
    const openEvents = state.events.filter((e) => e.status === "OPEN");
    if (openEvents.length === 0) break;

    const event = pick(rng, openEvents);
    if (event.createdById === user.id) continue;

    const outcome = pick(rng, event.outcomes);
    const held = openSharesForUser(state, user.id, event.id, outcome.id);

    const trySell = held > 0 && rng() > BUY_CHANCE;

    try {
      if (trySell) {
        const maxSell = Math.max(1, Math.floor(held * 0.5));
        const shares = Math.max(
          1,
          Math.min(held, 1 + Math.floor(rng() * maxSell))
        );
        memorySellShares(state, {
          userId: user.id,
          eventId: event.id,
          outcomeId: outcome.id,
          shares,
        });
      } else {
        const maxAmount = Math.min(
          150,
          Math.max(10, Math.floor(user.balance * 0.2))
        );
        if (user.balance < 10) continue;
        const amount = Math.max(
          10,
          Math.min(maxAmount, 10 + Math.floor(rng() * (maxAmount - 9)))
        );
        memoryPlaceBet(state, {
          userId: user.id,
          eventId: event.id,
          outcomeId: outcome.id,
          amount,
        });
      }
    } catch (error) {
      if (!(error instanceof BetError)) throw error;
    }
  }
}

function resolveAllEvents(state: SimState, rng: () => number): void {
  for (const event of state.events) {
    if (event.status !== "OPEN") continue;
    const winner = pick(rng, event.outcomes);
    memoryResolveEvent(state, event.id, winner.id);
  }
}

type UserResult = {
  username: string;
  balance: number;
  netProfit: number;
};

function printReport(state: SimState): Record<string, unknown> {
  const totalUserBalance = state.users.reduce((s, u) => s + u.balance, 0);
  const totalPool = state.events.reduce((s, e) => s + e.poolBalance, 0);
  const initialTotal = USER_COUNT * INITIAL_BALANCE;

  console.log("\n=== LMSR market simulation report ===\n");
  console.log(`Seed: ${SEED}`);
  console.log(`Rounds: ${ROUNDS}`);
  console.log(
    `Buys: ${state.stats.buys} | Sells: ${state.stats.sells} | Skips: ${state.stats.skips}`
  );
  console.log(
    `Conservation: initial=${initialTotal} | users+pools=${totalUserBalance + totalPool} | delta=${totalUserBalance + totalPool - initialTotal}`
  );

  const eventSummaries = state.events.map((event) => {
    const market = marketFromEvent(event);
    const prices = getOutcomePrices(market);
    const winner = event.outcomes.find((o) => o.id === event.resolvedOutcomeId);
    console.log(`\n--- ${event.title} ---`);
    console.log(`Winner: ${winner?.label ?? "n/a"} | pool ${event.poolBalance}`);
    event.outcomes.forEach((o, i) => {
      console.log(`  ${o.label}: ${prices[i]}¢ | q=${o.lmsrQ}`);
    });
    return {
      id: event.id,
      title: event.title,
      winner: winner?.label,
      poolBalance: event.poolBalance,
      outcomes: event.outcomes.map((o, i) => ({
        label: o.label,
        priceCents: prices[i],
        lmsrQ: o.lmsrQ,
      })),
    };
  });

  const results: UserResult[] = state.users.map((u) => ({
    username: u.username,
    balance: u.balance,
    netProfit: u.balance - u.initialBalance,
  }));

  results.sort((a, b) => b.netProfit - a.netProfit);

  const activeUsers = new Set(state.bets.map((b) => b.userId)).size;
  const avgBalance = totalUserBalance / USER_COUNT;

  console.log("\n--- Top 10 by net profit ---");
  results.slice(0, 10).forEach((r, i) => {
    console.log(
      `${i + 1}. ${r.username}: ${r.netProfit >= 0 ? "+" : ""}${r.netProfit} (balance ${r.balance})`
    );
  });

  console.log("\n--- Bottom 10 by net profit ---");
  results
    .slice(-10)
    .reverse()
    .forEach((r, i) => {
      console.log(
        `${i + 1}. ${r.username}: ${r.netProfit >= 0 ? "+" : ""}${r.netProfit} (balance ${r.balance})`
      );
    });

  console.log("\n--- Stats ---");
  console.log(`Active users (placed at least one bet): ${activeUsers}`);
  console.log(`Average balance: ${avgBalance.toFixed(1)}`);

  return {
    seed: SEED,
    rounds: ROUNDS,
    stats: state.stats,
    conservation: {
      initialTotal,
      finalUsersPlusPools: totalUserBalance + totalPool,
      delta: totalUserBalance + totalPool - initialTotal,
    },
    events: eventSummaries,
    top10: results.slice(0, 10),
    bottom10: results.slice(-10).reverse(),
    activeUsers,
    averageBalance: avgBalance,
  };
}

function main(): void {
  const rng = mulberry32(SEED);
  const state = buildInitialState();

  console.log("Running LMSR simulation...");
  runSimulation(state, rng);
  resolveAllEvents(state, rng);

  const report = printReport(state);

  const logPath = path.join(process.cwd(), "logs", "simulation-result.json");
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(report, null, 2));
  console.log(`\nWrote ${logPath}`);
}

main();
