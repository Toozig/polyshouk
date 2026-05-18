import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const revalidate = 0;

export default async function AdminDashboard() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") redirect("/");

  const [userCount, openEventCount, pendingBetCount] = await Promise.all([
    prisma.user.count(),
    prisma.event.count({ where: { status: "OPEN" } }),
    prisma.bet.count({ where: { status: "PENDING" } }),
  ]);

  const stats = [
    { label: "משתמשים רשומים", value: userCount, href: "/admin/users" },
    { label: "אירועים פתוחים", value: openEventCount, href: "/admin/events" },
    { label: "הימורים פעילים", value: pendingBetCount, href: "/admin/events" },
  ];

  const adminLinks = [
    { href: "/admin/events", label: "ניהול אירועים", description: "צור וסגור אירועים" },
    { href: "/admin/users", label: "ניהול משתמשים", description: "צפה ונהל משתמשים" },
    { href: "/admin/codes", label: "קודי הזמנה", description: "צור וצפה בקודי הזמנה" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">לוח בקרה</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-400 text-sm font-normal">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <h3 className="text-white font-semibold text-lg">{link.label}</h3>
                <p className="text-slate-400 text-sm mt-1">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
