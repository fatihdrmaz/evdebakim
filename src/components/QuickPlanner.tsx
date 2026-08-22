"use client";
import { useState } from "react";
import { CalendarRange, Loader2 } from "lucide-react";
import { bulkSchedule } from "@/lib/actions";
import { Field } from "@/components/ui";

export default function QuickPlanner({ saleId, encounterId, nurses, unscheduled, total, defaultNurse }: { saleId: string; encounterId: string; nurses: { id: string; full_name: string }[]; unscheduled: number; total: number; defaultNurse?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [every, setEvery] = useState(1);
  const [skip, setSkip] = useState(false);
  const [only, setOnly] = useState(unscheduled > 0 && unscheduled < total);
  const count = only ? unscheduled : total;
  // Önizleme
  const preview: string[] = []; const cur = new Date(`${start}T00:00:00`);
  for (let i = 0; i < count && preview.length < 7; i++) {
    while (skip && (cur.getDay() === 0 || cur.getDay() === 6)) cur.setDate(cur.getDate() + 1);
    preview.push(cur.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" })); cur.setDate(cur.getDate() + every);
  }
  return (
    <details open={unscheduled > 0} className="rounded-xl border border-brand-200 bg-brand-50/50">
    <summary className="flex items-center gap-2 px-3 sm:px-4 h-11 text-sm font-semibold text-brand-800 cursor-pointer"><CalendarRange className="size-4" />Hızlı Planlama<span className="ml-auto text-xs font-medium text-brand-700">{unscheduled > 0 ? `${unscheduled} seans planlanmadı` : "Yeniden planla"}</span></summary>
    <form action={async fd => { setBusy(true); await bulkSchedule(fd); setBusy(false); }} className="p-3 sm:p-4 pt-0 space-y-3">
      <input type="hidden" name="sale_id" value={saleId} /><input type="hidden" name="encounter_id" value={encounterId} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field label="Başlangıç günü"><input name="start_date" type="date" className="input" value={start} onChange={e => setStart(e.target.value)} required /></Field>
        <Field label="Saat"><input name="time" type="time" className="input" value={time} onChange={e => setTime(e.target.value)} required /></Field>
        <Field label="Kaç günde bir"><select name="every_days" className="input" value={every} onChange={e => setEvery(Number(e.target.value))}><option value={1}>Her gün</option><option value={2}>2 günde bir</option><option value={3}>3 günde bir</option><option value={7}>Haftada bir</option></select></Field>
        <Field label="Hemşire"><select name="nurse_id" className="input" defaultValue={defaultNurse ?? ""}><option value="">Değiştirme</option>{nurses.map(n => <option key={n.id} value={n.id}>{n.full_name}</option>)}</select></Field>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <label className="flex items-center gap-2 min-h-9 cursor-pointer"><input type="checkbox" name="skip_weekends" checked={skip} onChange={e => setSkip(e.target.checked)} className="size-4 accent-brand-600" />Hafta sonunu atla</label>
        {unscheduled > 0 && unscheduled < total && <label className="flex items-center gap-2 min-h-9 cursor-pointer"><input type="checkbox" name="only_unscheduled" checked={only} onChange={e => setOnly(e.target.checked)} className="size-4 accent-brand-600" />Sadece planlanmamışlar ({unscheduled})</label>}
      </div>
      <div className="text-xs text-slate-600"><span className="font-medium">{count} seans:</span> {preview.join(" · ")}{count > 7 && " …"} <span className="num">saat {time}</span></div>
      <button className="btn w-full sm:w-auto" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <CalendarRange className="size-4" />}Seansları Planla</button>
    </form>
    </details>
  );
}
