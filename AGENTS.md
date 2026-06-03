<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Local dev issues

When the user reports UI bugs, build failures, or “it breaks locally”, **read logs first** — do not rely on not seeing their screen.

1. `logs/dev-server.log` — output from `npm run dev` (compile/CSS/module/Prisma/server errors). Use the latest block between `--- dev session` markers.
2. `logs/runtime-issues.jsonl` — client-side errors and optional manual notes (one JSON object per line).
3. Cursor terminal captures under `.cursor/projects/<project>/terminals/*.txt` — supplementary, may be stale.

To log a visual issue the user describes, append a `type: "manual"` line to `runtime-issues.jsonl` (see `logs/README.md`).

`npm run dev` writes to these files automatically. Use `npm run dev:plain` only if logging must be disabled.

## Prediction market (LMSR)

Polyshouk is a **house-backed** prediction market (not an order book). The platform is the sole counterparty. Pricing uses the **Logarithmic Market Scoring Rule (LMSR)**.

### Code map

| Area | Location |
|------|----------|
| Pure math | `lib/lmsr.ts` |
| Quotes, cents display, buy/sell wrappers | `lib/market.ts` |
| Bet quotes & creator check | `lib/bets/quotes.ts` |
| Place / sell execution | `lib/bets/place-bet.ts`, `lib/bets/sell-shares.ts` |
| Fix drifted `lmsrQ` | `lib/bets/reconcile-lmsr.ts` |
| Resolution & pool payout | `lib/events/resolve-event.ts` |
| Event URLs & route parsing | `lib/events/event-route-param.ts` (`eventNumber` in path; legacy `id` still works) |
| Prices API | `GET /api/events/[segment]/price` — `segment` = `eventNumber` (digits) or legacy internal `id` |
| In-memory sim | `scripts/simulate-market.ts`, `lib/bets/memory.ts` |
| Premium per-outcome positions (open markets only) | `User.isPremium`, `PREMIUM_SUBSCRIPTION_PRICE` in `lib/constants.ts`, `POST /api/user/premium` (self-pay), `lib/premium-outcome-shares.ts`, `components/events/premium-event-insights.tsx`, `components/navbar-premium-cta.tsx`, admin `PATCH /api/admin/users/[id]/premium` |
| Public resolved betting recap (who bet / won / lost) | `components/events/resolved-event-betting-summary.tsx` on `app/events/[id]/page.tsx` when `Event.status === RESOLVED` |

### Parameters & DB

- **`Event.eventNumber`** — Monotonic public id; canonical URLs are `/events/<eventNumber>`. Internal `Event.id` (cuid) still resolves and redirects to the numeric URL.
- **`m` (`Event.liquidityM`)** — Creator-locked collateral (coins). Minimum `MIN_LIQUIDITY_M` (50), default `DEFAULT_LIQUIDITY_M` (100). Deducted on `POST /api/events`.
- **`b` (`Event.bParameter`)** — LMSR depth. Set on create as `m / ln(n)` outcomes (`defaultBParameter` in `lib/lmsr.ts`). Higher `b` → slower price moves.
- **`qᵢ` (`Outcome.lmsrQ`)** — LMSR quantity per outcome. **Initialized to `m` for every outcome** at market creation.
- **`Event.poolBalance`** — House pool: starts at `m`, increases on buys, decreases on sells and winner payouts. Surplus after resolution goes back to the creator (`EVENT_LIQUIDITY_RETURN`).

### Formulas

State vector `q = (q₁, …, qₙ)`, liquidity depth `b`:

- **Cost function:** `C(q) = b · ln(Σⱼ exp(qⱼ/b))` (implemented with log-sum-exp in `lmsrCost`)
- **Implied probability:** `Pᵢ = exp(qᵢ/b) / Σⱼ exp(qⱼ/b)` → UI shows `price_cents` (binary markets forced to sum to 100¢)
- **Buy `n` shares of outcome `i`:** cost = `C(q + n·eᵢ) − C(q)` (`lmsrBuyCost`)
- **Sell `n` shares of outcome `i`:** proceeds = `C(q) − C(q − n·eᵢ)` (`lmsrSellProceeds`)

**Buy flow (API):** User sends a **coin budget** (`amount`). `lmsrSharesForBudget` binary-searches the largest integer `n` with buy cost ≤ budget. Actual debit is the LMSR cost (≤ budget), stored on the `Bet`.

**Sell floor:** Initial `qᵢ = m` is not user-owned inventory. Only shares **above** `m` can be repurchased by the house:

`maxSellableᵢ = max(0, qᵢ − m)` (`lmsrMaxSellableShares`)

Never let `qᵢ` drop below `m` when selling. UI `quoteSell` clamps; server validates in `quoteSellShares`.

### Invariant & reconciliation

After all open bets, each outcome should satisfy:

`qᵢ = m + Σ (sharesRemaining on outcome i among PENDING bets)`

If `lmsrQ <` that value (e.g. after schema migration), `reconcileEventLmsrQ` raises `lmsrQ`. Called on event page load and before sells.

### Market rules (enforced in code)

1. **Creator cannot trade** on their own event (`CREATOR_CANNOT_TRADE` in `lib/bets/quotes.ts`).
2. **Creator liquidity is locked** until resolution; surplus pool returned on resolve.
3. **Winning share pays 1 coin** per share (`PAYOUT_PER_SHARE`); losers get 0.

### Constants

See `lib/constants.ts`: `DEFAULT_LIQUIDITY_M`, `MIN_LIQUIDITY_M`, `CURRENCY_NAME` (ערך).

### Do not regress

- Do not price from `totalBetAmount` or linear `sharesFromSpend` for execution — those helpers are display/legacy only where still referenced.
- Always pass `liquidityM` into `marketFromEvent()` / `LmsrMarketState`.
- Selling without the `m` floor will throw or mis-price (“Cannot sell more shares than market holds”).
