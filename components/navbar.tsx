import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCoins } from "@/lib/utils";
import { NavbarNotifications } from "@/components/navbar-notifications";
import { NavbarPremiumCta } from "@/components/navbar-premium-cta";
import { SignOutButton } from "@/components/sign-out-button";
import { UserLink } from "@/components/user/user-link";

export async function Navbar() {
  const session = await auth();
  const sessionUser = session?.user as
    | { id: string; name?: string | null; role?: string }
    | undefined;

  const dbUser = sessionUser?.id
    ? await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          username: true,
          role: true,
          balance: true,
          isPremium: true,
        },
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
              סולם הערכים שלי
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

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {user ? (
            <>
              <NavbarPremiumCta
                balance={user.balance}
                isPremium={user.isPremium}
              />
              <NavbarNotifications />
              <UserLink
                username={user.username}
                showAvatar
                className="text-slate-300 text-sm hover:text-white"
              />
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
