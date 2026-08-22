"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function SubNav({ items }: { items: { href: string; label: string; exact?: boolean }[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-5 border-b border-slate-200" aria-label="Alt menü">
      {items.map(i => { const a = i.exact ? path === i.href : path.startsWith(i.href); return (
        <Link key={i.href} href={i.href} aria-current={a ? "page" : undefined} className={`shrink-0 px-3.5 h-11 flex items-center text-sm font-medium border-b-2 -mb-px transition-colors ${a ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{i.label}</Link>); })}
    </nav>
  );
}
