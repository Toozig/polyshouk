"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { REGISTRATION_PRIVACY_DISCLAIMER } from "@/lib/constants";
import { parseJsonResponse } from "@/lib/parse-response";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let response: Response;
    try {
      response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          inviteCode,
          acceptedTerms: acceptedTerms ? true : false,
        }),
      });
    } catch {
      setLoading(false);
      setError("לא ניתן להתחבר לשרת. נסה שוב.");
      return;
    }

    const { data, parseError } = await parseJsonResponse<{ error?: string }>(
      response
    );
    setLoading(false);

    if (parseError) {
      setError("תשובה לא תקינה מהשרת. נסה שוב.");
      return;
    }

    if (!response.ok) {
      setError(data?.error ?? "אירעה שגיאה. נסה שנית.");
      return;
    }

    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">
            הצטרפות לפולישוק
          </CardTitle>
          <p className="text-slate-400 text-sm">
            קבל 1,000 ערך להתחלה בהרשמה
          </p>
        </CardHeader>
        <CardContent>
          <div
            role="note"
            className="mb-4 rounded-lg border border-amber-600/40 bg-amber-950/40 px-3 py-3 text-amber-100/90 text-sm leading-relaxed text-right"
          >
            {REGISTRATION_PRIVACY_DISCLAIMER}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">
                שם משתמש
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={24}
                autoComplete="username"
                className="bg-slate-700 border-slate-600 text-white text-right placeholder:text-slate-400"
                placeholder="לדוגמה: player_42"
                dir="ltr"
              />
              <p className="text-slate-500 text-xs">
                משמש להתחברות ומוצג לאחרים — לא שם אמיתי ולא פרטים מזהים.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                סיסמה
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                placeholder="לפחות 6 תווים"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-slate-300">
                קוד הזמנה
              </Label>
              <Input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className="bg-slate-700 border-slate-600 text-white text-right placeholder:text-slate-400"
                placeholder="XXXXXXXX"
                dir="ltr"
              />
            </div>

            <div className="flex gap-3 items-start rounded-lg border border-slate-600/60 bg-slate-900/50 px-3 py-3">
              <input
                id="acceptedTerms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                className="mt-1 size-4 shrink-0 rounded border-slate-500 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="acceptedTerms"
                className="text-sm text-slate-300 leading-relaxed text-right cursor-pointer"
              >
                קראתי והסכמתי ל{" "}
                <Link
                  href="/takanon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  תקנון האתר
                </Link>
                .
              </label>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "נרשם..." : "הצטרף"}
            </Button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-4">
            כבר יש לך חשבון?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              התחבר
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
