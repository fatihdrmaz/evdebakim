import { redirect } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import { ROLE } from "@/lib/format";
import NavLinks from "@/components/NavLinks";
import LogoutButton from "@/components/LogoutButton";
import { Avatar } from "@/components/ui";

const NAV: [string, string][] = [["/", "Bugün"], ["/hastalar", "Hastalar"], ["/muayeneler", "Muayeneler"], ["/takvim", "Takvim"], ["/stok", "Stok"], ["/ayarlar", "Ayarlar"]];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const p = await getProfile();
  if (!p) redirect("/login");
  const nav = p.role === "hekim" ? NAV.filter(n => n[0] === "/" || n[0] === "/hastalar") : NAV;
  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-slate-200 px-4 py-5">
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <span className="size-9 rounded-xl bg-brand-600 text-white flex items-center justify-center"><HeartPulse className="size-5" /></span>
          <div><div className="font-bold text-slate-900 leading-tight">Evde Bakım</div><div className="text-[11px] text-slate-500">Hasta & seans yönetimi</div></div>
        </div>
        <nav className="flex flex-col gap-1"><NavLinks items={nav} variant="side" /></nav>
        <div className="mt-auto border-t border-slate-200 pt-4 flex items-center gap-3 px-1">
          <Avatar name={p.full_name} size="sm" />
          <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{p.full_name}</div><div className="text-xs text-slate-500">{ROLE[p.role]}</div></div>
          <LogoutButton />
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-4 h-14 flex items-center gap-2.5">
        <span className="size-8 rounded-lg bg-brand-600 text-white flex items-center justify-center"><HeartPulse className="size-4" /></span>
        <span className="font-bold">Evde Bakım</span>
        <div className="ml-auto flex items-center gap-2"><span className="text-xs text-slate-500 hidden sm:inline">{p.full_name}</span><Avatar name={p.full_name} size="sm" /><LogoutButton /></div>
      </header>

      <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 max-w-6xl mx-auto pb-24 lg:pb-8">{children}</main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 flex pb-[env(safe-area-inset-bottom)]" aria-label="Ana menü">
        <NavLinks items={nav} variant="bottom" />
      </nav>
    </div>
  );
}
