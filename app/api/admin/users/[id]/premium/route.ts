import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  isPremium: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "גישה נדחתה" }, { status: 403 });
  }

  const { id: userId } = await params;
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isPremium: parsed.data.isPremium },
    select: { id: true, username: true, isPremium: true },
  });

  return NextResponse.json(user);
}
