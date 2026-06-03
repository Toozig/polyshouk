import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-3 text-center">
      <p className="text-[11px] text-slate-500">
        <Link
          href="/takanon"
          className="text-slate-400 underline-offset-2 hover:text-slate-300 hover:underline"
        >
          תקנון
        </Link>
      </p>
    </footer>
  );
}
