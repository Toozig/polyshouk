/** Default creator liquidity deposit (m) when not specified. */
export const DEFAULT_LIQUIDITY_M = 100;

/** Minimum liquidity (m) required to create a market. */
export const MIN_LIQUIDITY_M = 50;

/**
 * Multiplies the baseline LMSR depth `b` (= m / ln n).
 *
 * Baseline `b = m / ln n` caps the house's worst-case subsidy at exactly `m`,
 * but makes the market so shallow that a few thousand shares push prices to
 * 0/100. A larger multiplier makes the market much deeper so prices stay
 * relative under heavy betting. Tradeoff: the house's worst-case loss grows to
 * `multiplier · m`, i.e. it can pay out more than the creator's locked `m`.
 */
export const LIQUIDITY_DEPTH_MULTIPLIER = 10;

/** Display name for in-app currency. */
export const CURRENCY_NAME = "ערך";

/** Coins charged once to enable premium insights (navbar self-upgrade). */
export const PREMIUM_SUBSCRIPTION_PRICE = 100;

/** Latest allowed betting close date for new events (2 Nov 2026, end of day). */
export const EVENT_CLOSES_AT_MAX = new Date(2026, 10, 2, 23, 59, 59, 999);

/** Shown on registration — users should not submit personal identifiable info. */
export const REGISTRATION_PRIVACY_DISCLAIMER =
  "אנחנו לא נושאים באחריות לדליפה או חשיפה של מידע אישי דרך השירות. נא לא להזין פרטים מזהים (שם אמיתי, כתובת, טלפון וכו'). בחרו שם משתמש ציבורי בלבד — לא מידע פרטי.";
