import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/events");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold text-white mb-4">
          פולישוק
        </h1>
        <p className="text-xl text-slate-400 mb-2">שוק תחזיות בעברית</p>
        <p className="text-slate-500 mb-10">
          הנח הימורים על אירועים עתידיים, צבור ערך וצפה בתחזיותיך מתממשות
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/events"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            צפה באירועים
          </Link>
          <Link
            href="/register"
            className="border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            הצטרף עכשיו
          </Link>
        </div>
      </div>
    </div>
  );
}
