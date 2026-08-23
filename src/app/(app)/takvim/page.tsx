import Link from "next/link";
import { ChevronLeft, ChevronRight, User, CalendarX2 } from "lucide-react";
import { addDays, format, startOfWeek, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";

const TONE: Record<string, string> = { tamamlandi: "border-emerald-200 bg-emerald-50", iptal: "border-slate-200 bg-slate-50", planlandi: "border-brand-200 bg-white" };
const DOT: Record<string, string> = { tamamlandi: "bg-emerald-500", iptal: "bg-slate-400", planlandi: "bg-brand-500" };

export default async function Calendar({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const { w } = await searchParams; const sb = await createClient();
  const base = w ? new Date(w) : new Date(); const start = startOfWeek(base, { weekStartsOn: 1 }); const end = addDays(start, 7);
  const { data } = await sb.from("sessions").select("id, seq, scheduled_at, status, patients(first_name,last_name), sales(session_count, services(name)), profiles(full_name)")
    .gte("scheduled_at", start.toISOString()).lt("scheduled_at", end.toISOString()).order("scheduled_at");
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)); const today = new Date();
  const weekTotal = data?.length ?? 0;
  return (
    <div>
      <PageHeader title="Takvim" subtitle={`${format(start, "d MMMM", { locale: tr })} – ${format(addDays(start, 6), "d MMMM yyyy", { locale: tr })} · ${weekTotal} seans`}
        action={<div className="flex gap-1"><Link href={`?w=${format(addDays(start, -7), "yyyy-MM-dd")}`} aria-label="Önceki hafta" className="btn-secondary px-3"><ChevronLeft className="size-4" /></Link><Link href="/takvim" className="btn-secondary">Bugün</Link><Link href={`?w=${format(addDays(start, 7), "yyyy-MM-dd")}`} aria-label="Sonraki hafta" className="btn-secondary px-3"><ChevronRight className="size-4" /></Link></div>} />
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map(day => {
          const items = (data ?? []).filter((x: any) => isSameDay(new Date(x.scheduled_at), day)); const isToday = isSameDay(day, today);
          return (
            <section key={day.toISOString()} className={`card p-2.5 min-h-32 flex flex-col ${isToday ? "ring-2 ring-brand-500 border-transparent bg-brand-50/30" : ""}`}>
              <header className={`flex items-center justify-between md:flex-col md:items-start gap-1 px-1 pb-2 mb-2 border-b ${isToday ? "border-brand-100" : "border-slate-100"}`}>
                <div className="flex items-baseline gap-1.5 md:flex-col md:gap-0">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{format(day, "EEEE", { locale: tr })}</span>
                  <span className="flex items-baseline gap-1.5">
                    <span className={`text-lg font-bold num ${isToday ? "text-brand-600" : "text-slate-900"}`}>{format(day, "d")}</span>
                    {isToday && <span className="badge badge-blue">Bugün</span>}
                  </span>
                </div>
                {items.length > 0 && <span className="badge badge-slate num">{items.length}</span>}
              </header>
              {!items.length && <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-slate-300 py-3"><CalendarX2 className="size-5" /><p className="text-xs text-slate-400">Seans yok</p></div>}
              <div className="space-y-1.5 flex-1">{items.map((x: any) => (
                <Link key={x.id} href={`/seans/${x.id}`} className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-xs transition-shadow hover:shadow-sm ${TONE[x.status] ?? TONE.planlandi} ${x.status === "iptal" ? "text-slate-500 line-through" : "text-slate-900"}`}>
                  <span className={`size-1.5 rounded-full mt-1.5 shrink-0 ${DOT[x.status] ?? DOT.planlandi}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5"><b className="num shrink-0">{format(new Date(x.scheduled_at), "HH:mm")}</b><span className="font-medium truncate">{x.patients.first_name} {x.patients.last_name}</span></div>
                    <div className="text-slate-500 truncate mt-0.5">{x.sales.services.name} · {x.seq}/{x.sales.session_count}</div>
                    {x.profiles && <div className="flex items-center gap-1 text-slate-400 mt-0.5"><User className="size-3 shrink-0" /><span className="truncate">{x.profiles.full_name.split(" ")[0]}</span></div>}
                  </div>
                </Link>))}</div>
            </section>);
        })}
      </div>
      <p className="hint mt-4">Saat değiştirmek için seansa girip Planlama bölümünü kullanın. Planlanmamış seanslar Bugün sayfasında listelenir.</p>
    </div>
  );
}
