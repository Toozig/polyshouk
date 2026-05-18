import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCoins } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";

export async function Navbar() {
  const session = await auth();
  const sessionUser = session?.user as
    | { id: string; name?: string | null; role?: string }
    | undefined;

  const dbUser = sessionUser?.id
    ? await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, name: true, role: true, balance: true },
      })
    : null;

  const user = dbUser ?? undefined;

  return (
    <nav className="bg-slate-900 border-b border-slate-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            פולישוק
          </Link>
          <Link
            href="/events"
            className="text-slate-300 hover:text-white transition-colors"
          >
            אירועים
          </Link>
          {user && (
            <Link
              href="/profile"
              className="text-slate-300 hover:text-white transition-colors"
            >
              פרופיל
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              ניהול
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-slate-300 text-sm">{user.name}</span>
              {user.balance !== undefined && (
                <span className="text-blue-400 text-sm font-medium">
                  {formatCoins(user.balance)}
                </span>
              )}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                התחברות
              </Link>
              <Link
                href="/register"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                הרשמה
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
