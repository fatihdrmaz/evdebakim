import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { ROLE } from "@/lib/format";
import LogoutButton from "@/components/LogoutButton";
const NAV = [
  ["/", "Bugün", "🏠"], ["/hastalar", "Hastalar", "🧑‍🤝‍🧑"], ["/takvim", "Takvim", "📅"], ["/stok", "Stok", "📦"], ["/ayarlar", "Ayarlar", "⚙️"],
];
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const p = await getProfile();
  if (!p) redirect("/login");
  const nav = p.role === "hekim" ? NAV.filter(n => n[0] === "/" || n[0] === "/hastalar") : NAV;
  return (
    <div className="min-h-dvh pb-20 md:pb-0 md:pl-56">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col bg-white border-r border-slate-200 p-4">
        <div className="font-semibold text-teal-700 text-lg mb-6">Evde Bakım</div>
        {nav.map(([h, l, i]) => <Link key={h} href={h} className="px-3 py-2 rounded-lg hover:bg-slate-100 text-sm">{i} {l}</Link>)}
        <div className="mt-auto text-xs text-slate-500">{p.full_name}<br />{ROLE[p.role]}<LogoutButton /></div>
      </aside>
      <main className="p-4 max-w-5xl mx-auto">{children}</main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex justify-around pb-[env(safe-area-inset-bottom)]">
        {nav.map(([h, l, i]) => <Link key={h} href={h} className="flex flex-col items-center py-2 px-1 text-[11px] text-slate-600"><span className="text-xl">{i}</span>{l}</Link>)}
      </nav>
    </div>
  );
}
