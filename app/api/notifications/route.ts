import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listNotificationsForUser } from "@/lib/notifications/queries";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  const data = await listNotificationsForUser(session.user.id);
  return NextResponse.json(data);
}
