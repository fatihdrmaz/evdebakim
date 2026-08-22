import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUS } from "@/lib/format";
import { addDays, format, startOfWeek } from "date-fns";
import { tr } from "date-fns/locale";
export default async function Calendar({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const { w } = await searchParams; const sb = await createClient();
  const base = w ? new Date(w) : new Date(); const start = startOfWeek(base, { weekStartsOn: 1 }); const end = addDays(start, 7);
  const { data } = await sb.from("sessions").select("id, seq, scheduled_at, status, patients(first_name,last_name), sales(session_count, services(name)), profiles(full_name)")
    .gte("scheduled_at", start.toISOString()).lt("scheduled_at", end.toISOString()).order("scheduled_at");
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const todayKey = format(new Date(), "yyyy-MM-dd");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><h1 className="text-xl font-semibold flex-1">Takvim</h1>
        <Link href={`?w=${format(addDays(start, -7), "yyyy-MM-dd")}`} className="btn-outline">‹</Link><Link href="/takvim" className="btn-outline">Bugün</Link><Link href={`?w=${format(addDays(start, 7), "yyyy-MM-dd")}`} className="btn-outline">›</Link></div>
      <p className="text-sm text-slate-500">{format(start, "d MMM", { locale: tr })} – {format(addDays(start, 6), "d MMM yyyy", { locale: tr })}</p>
      <div className="grid md:grid-cols-7 gap-2">{days.map(day => { const k = format(day, "yyyy-MM-dd"); const items = (data ?? []).filter((x: any) => format(new Date(x.scheduled_at), "yyyy-MM-dd") === k);
        return (<div key={k} className={`card p-2 min-h-20 ${k === todayKey ? "ring-2 ring-teal-500" : ""}`}>
          <div className="text-xs font-medium text-slate-600 mb-1">{format(day, "EEEE d", { locale: tr })}</div>
          {items.map((x: any) => <Link key={x.id} href={`/seans/${x.id}`} className={`block rounded-md px-2 py-1 mb-1 text-xs ${x.status === "tamamlandi" ? "bg-green-50 text-green-800" : x.status === "iptal" ? "bg-red-50 text-red-700 line-through" : "bg-teal-50 text-teal-800"}`}>
            <b>{format(new Date(x.scheduled_at), "HH:mm")}</b> {x.patients.first_name} {x.patients.last_name}<div className="text-[10px] opacity-70">{x.sales.services.name} {x.seq}/{x.sales.session_count}{x.profiles && ` · ${x.profiles.full_name}`}</div></Link>)}
          {!items.length && <div className="text-xs text-slate-300">—</div>}
        </div>); })}</div>
      <p className="text-xs text-slate-500">Saat değiştirmek için seansa tıklayıp "Planla" alanını kullanın. Planlanmamış seanslar ana sayfada listelenir.</p>
    </div>
  );
}
