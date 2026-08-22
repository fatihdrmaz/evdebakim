"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, CalendarDays, Package, Settings, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { "/": Home, "/hastalar": Users, "/takvim": CalendarDays, "/stok": Package, "/ayarlar": Settings };

export default function NavLinks({ items, variant }: { items: [string, string][]; variant: "side" | "bottom" }) {
  const path = usePathname();
  const isActive = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  if (variant === "bottom") {
    return (
      <>
        {items.map(([h, l]) => { const I = ICONS[h]; const a = isActive(h); return (
          <Link key={h} href={h} aria-current={a ? "page" : undefined} className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-14 text-[11px] font-medium transition-colors ${a ? "text-brand-600" : "text-slate-500"}`}>
            <span className={`px-3 py-0.5 rounded-full transition-colors ${a ? "bg-brand-50" : ""}`}><I className="size-5" strokeWidth={a ? 2.4 : 2} /></span>{l}
          </Link>); })}
      </>
    );
  }
  return (
    <>
      {items.map(([h, l]) => { const I = ICONS[h]; const a = isActive(h); return (
        <Link key={h} href={h} aria-current={a ? "page" : undefined} className={`flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors ${a ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
          <I className="size-5" strokeWidth={a ? 2.4 : 2} />{l}
        </Link>); })}
    </>
  );
}
