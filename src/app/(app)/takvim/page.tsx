import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, format, startOfWeek, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";

export default async function Calendar({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const { w } = await searchParams; const sb = await createClient();
  const base = w ? new Date(w) : new Date(); const start = startOfWeek(base, { weekStartsOn: 1 }); const end = addDays(start, 7);
  const { data } = await sb.from("sessions").select("id, seq, scheduled_at, status, patients(first_name,last_name), sales(session_count, services(name)), profiles(full_name)")
    .gte("scheduled_at", start.toISOString()).lt("scheduled_at", end.toISOString()).order("scheduled_at");
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)); const today = new Date();
  const tone = (st: string) => st === "tamamlandi" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : st === "iptal" ? "bg-slate-50 border-slate-200 text-slate-500 line-through" : "bg-brand-50 border-brand-200 text-brand-900";
  return (
    <div>
      <PageHeader title="Takvim" subtitle={`${format(start, "d MMMM", { locale: tr })} – ${format(addDays(start, 6), "d MMMM yyyy", { locale: tr })}`}
        action={<div className="flex gap-1"><Link href={`?w=${format(addDays(start, -7), "yyyy-MM-dd")}`} aria-label="Önceki hafta" className="btn-secondary px-3"><ChevronLeft className="size-4" /></Link><Link href="/takvim" className="btn-secondary">Bugün</Link><Link href={`?w=${format(addDays(start, 7), "yyyy-MM-dd")}`} aria-label="Sonraki hafta" className="btn-secondary px-3"><ChevronRight className="size-4" /></Link></div>} />
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map(day => {
          const items = (data ?? []).filter((x: any) => isSameDay(new Date(x.scheduled_at), day)); const isToday = isSameDay(day, today);
          return (
            <section key={day.toISOString()} className={`card p-2.5 min-h-28 ${isToday ? "ring-2 ring-brand-500 border-transparent" : ""}`}>
              <header className="flex items-baseline justify-between md:flex-col md:items-start px-1 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{format(day, "EEEE", { locale: tr })}</span>
                <span className={`text-lg font-bold num ${isToday ? "text-brand-600" : ""}`}>{format(day, "d")}</span>
              </header>
              {!items.length && <p className="text-xs text-slate-400 px-1">Seans yok</p>}
              <div className="space-y-1.5">{items.map((x: any) => (
                <Link key={x.id} href={`/seans/${x.id}`} className={`block rounded-lg border px-2.5 py-2 text-xs transition-colors hover:brightness-95 ${tone(x.status)}`}>
                  <div className="flex items-center gap-1.5"><b className="num">{format(new Date(x.scheduled_at), "HH:mm")}</b><span className="font-medium truncate">{x.patients.first_name} {x.patients.last_name}</span></div>
                  <div className="opacity-75 truncate">{x.sales.services.name} · {x.seq}/{x.sales.session_count}{x.profiles && ` · ${x.profiles.full_name.split(" ")[0]}`}</div>
                </Link>))}</div>
            </section>);
        })}
      </div>
      <p className="hint mt-4">Saat değiştirmek için seansa girip Planlama bölümünü kullanın. Planlanmamış seanslar Bugün sayfasında listelenir.</p>
    </div>
  );
}
