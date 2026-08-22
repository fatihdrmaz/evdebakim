"use client";
import { useState } from "react";
import { tl } from "@/lib/format";
import { Card, Field } from "@/components/ui";

export default function SaleForm({ patientId, encounterId, services, action }: { patientId: string; encounterId: string; services: any[]; action: (fd: FormData) => Promise<void> }) {
  const [svc, setSvc] = useState(services[0]?.id ?? "");
  const [count, setCount] = useState(5);
  const [price, setPrice] = useState<number>(services[0]?.default_price ?? 0);
  const [payer, setPayer] = useState("hasta");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="patient_id" value={patientId} /><input type="hidden" name="encounter_id" value={encounterId} />
      <Card title="Hizmet">
        <div className="space-y-4">
          <Field label="Hizmet" required><select name="service_id" className="input" value={svc} onChange={e => { setSvc(e.target.value); setPrice(services.find(s => s.id === e.target.value)?.default_price ?? 0); }}>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Seans sayısı" required><input name="session_count" type="number" min={1} inputMode="numeric" className="input" value={count} onChange={e => setCount(Number(e.target.value))} required /></Field>
            <Field label="Seans başı fiyat (₺)" required hint="Bu hastaya özel fiyat"><input name="unit_price" type="number" step="0.01" inputMode="decimal" className="input" value={price} onChange={e => setPrice(Number(e.target.value))} required /></Field>
          </div>
        </div>
      </Card>
      <Card title="Ödeme">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Ödeyen">
            {[["hasta", "Hasta öder", "Nakit, kart veya havale"], ["kurum", "Kurum ödemeli", "Ücreti hekim tahsil eder"]].map(([v, l, h]) => (
              <label key={v} className={`rounded-xl border p-3 cursor-pointer transition-colors ${payer === v ? "border-brand-600 bg-brand-50 ring-2 ring-brand-500/20" : "border-slate-300 hover:bg-slate-50"}`}>
                <input type="radio" name="payer" value={v} checked={payer === v} onChange={() => setPayer(v)} className="sr-only" />
                <div className="font-medium text-sm">{l}</div><div className="text-xs text-slate-500 mt-0.5">{h}</div>
              </label>))}
          </div>
          <Field label="Not"><input name="notes" className="input" /></Field>
        </div>
      </Card>
      <div className="card card-pad flex items-center justify-between">
        <div><div className="text-xs text-slate-500">Toplam tutar</div><div className="text-2xl font-bold num">{tl(count * price)}</div><div className="text-xs text-slate-500">{count} seans × {tl(price)}</div></div>
        <button className="btn">Satışı Oluştur</button>
      </div>
    </form>
  );
}
