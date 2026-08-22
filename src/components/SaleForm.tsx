"use client";
import { useState } from "react";
import { tl } from "@/lib/format";
export default function SaleForm({ patientId, services, action }: { patientId: string; services: any[]; action: (fd: FormData) => Promise<void> }) {
  const [svc, setSvc] = useState(services[0]?.id ?? ""); const [count, setCount] = useState(5); const [price, setPrice] = useState<number>(services[0]?.default_price ?? 0);
  return (
    <form action={action} className="card space-y-3">
      <input type="hidden" name="patient_id" value={patientId} />
      <div><label className="label">Hizmet</label><select name="service_id" className="input" value={svc} onChange={e => { setSvc(e.target.value); setPrice(services.find(s => s.id === e.target.value)?.default_price ?? 0); }}>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Seans Sayısı</label><input name="session_count" type="number" min={1} className="input" value={count} onChange={e => setCount(Number(e.target.value))} required /></div>
        <div><label className="label">Seans Başı Fiyat (₺)</label><input name="unit_price" type="number" step="0.01" inputMode="decimal" className="input" value={price} onChange={e => setPrice(Number(e.target.value))} required /></div>
      </div>
      <div><label className="label">Ödeyen</label><select name="payer" className="input"><option value="hasta">Hasta öder (nakit/kart)</option><option value="kurum">Kurum ödemeli (hekim tahsil eder)</option></select></div>
      <div><label className="label">Not</label><input name="notes" className="input" /></div>
      <div className="text-right text-lg">Toplam: <b>{tl(count * price)}</b></div>
      <button className="btn w-full">Satışı Oluştur ({count} seans açılacak)</button>
    </form>
  );
}
