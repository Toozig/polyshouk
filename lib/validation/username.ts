import { z } from "zod";

const USERNAME_PATTERN = /^[\p{L}\p{N}_]+$/u;

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "שם משתמש חייב להכיל לפחות 3 תווים")
  .max(24, "שם משתמש יכול להכיל עד 24 תווים")
  .refine((value) => !value.includes("@"), {
    message: "שם משתמש לא יכול להכיל @ או להיראות כמו אימייל",
  })
  .refine((value) => !z.email().safeParse(value).success, {
    message: "שם משתמש לא יכול להיות כתובת אימייל",
  })
  .refine((value) => USERNAME_PATTERN.test(value), {
    message: "שם משתמש יכול להכיל אותיות, מספרים וקו תחתון בלבד",
  });

export function normalizeUsername(username: string): string {
  return username.trim();
}
