export type BetErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "EVENT_NOT_FOUND"
  | "EVENT_NOT_OPEN"
  | "BETTING_CLOSED"
  | "INVALID_OUTCOME"
  | "AMOUNT_TOO_LOW"
  | "INSUFFICIENT_BALANCE"
  | "INSUFFICIENT_SHARES"
  | "PROCEEDS_TOO_LOW"
  | "CREATOR_CANNOT_TRADE"
  | "INSUFFICIENT_MARKET_LIQUIDITY";

export class BetError extends Error {
  constructor(
    public readonly code: BetErrorCode,
    message: string
  ) {
    super(message);
    this.name = "BetError";
  }
}

export function betErrorMessage(code: BetErrorCode): string {
  const messages: Record<BetErrorCode, string> = {
    UNAUTHORIZED: "נדרשת התחברות",
    INVALID_INPUT: "נתונים לא תקינים",
    EVENT_NOT_FOUND: "אירוע לא נמצא",
    EVENT_NOT_OPEN: "האירוע אינו פתוח להימורים",
    BETTING_CLOSED: "תקופת ההימורים הסתיימה",
    INVALID_OUTCOME: "תוצאה לא תקינה",
    AMOUNT_TOO_LOW: "סכום ההימור נמוך מדי למחיר הנוכחי",
    INSUFFICIENT_BALANCE: "יתרה לא מספקת",
    INSUFFICIENT_SHARES: "אין מספיק מניות למכירה",
    PROCEEDS_TOO_LOW: "כמות המניות נמוכה מדי למחיר הנוכחי",
    CREATOR_CANNOT_TRADE:
      "יוצר השוק אינו יכול לסחור באירוע שלו — רק לספק נזילות",
    INSUFFICIENT_MARKET_LIQUIDITY:
      "לא ניתן למכור מניות אלו כרגע — נסה כמות קטנה יותר",
  };
  return messages[code];
}
