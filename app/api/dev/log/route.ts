import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

const LOG_FILE = join(process.cwd(), "logs", "runtime-issues.jsonl");

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entry = {
    ...(typeof body === "object" && body !== null ? body : { message: String(body) }),
    at: new Date().toISOString(),
  };

  mkdirSync(join(process.cwd(), "logs"), { recursive: true });
  appendFileSync(LOG_FILE, `${JSON.stringify(entry)}\n`);

  return NextResponse.json({ ok: true });
}
