import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import { dt, STATUS } from "@/lib/format";
import { addVital, addStockMove, applyKit, deleteStockMove, scheduleSession, setSessionStatus } from "@/lib/actions";
import ConsentPad from "@/components/ConsentPad";
const PHASE: Record<string, string> = { baslangic: "Başlangıç", ara: "Ara", bitis: "Bitiş" };
export default async function Session({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sb = await createClient(); const me = await getProfile();
  const { data: s } = await sb.from("sessions").select("*, patients(*), sales(session_count, service_id, services(name, requires_consent))").eq("id", id).single();
  if (!s) notFound();
  const staff = me?.role !== "hekim";
  const [{ data: vitals }, { data: consent }, { data: moves }, { data: an }, { data: nurses }, { data: products }, { data: kit }] = await Promise.all([
    sb.from("vitals").select("*").eq("session_id", id).order("measured_at"),
    sb.from("consents").select("*").eq("session_id", id).maybeSingle(),
    sb.from("stock_moves").select("*, products(name)").eq("session_id", id).order("created_at"),
    sb.from("anamnesis").select("allergies, medications").eq("patient_id", s.patient_id).maybeSingle(),
    sb.from("profiles").select("id, full_name").in("role", ["hemsire", "admin"]).eq("is_active", true),
    sb.from("product_stock").select("id, name, stock").eq("is_active", true).order("name"),
    sb.from("service_kits").select("quantity, products(name)").eq("service_id", s.sales.service_id),
  ]);
  const p = s.patients; const hasStart = vitals?.some(v => v.phase === "baslangic"); const hasEnd = vitals?.some(v => v.phase === "bitis");
  const canComplete = hasStart && hasEnd && (consent || !s.sales.services.requires_consent);
  const local = s.scheduled_at ? new Date(new Date(s.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
  const CONSENT_TEXT = `Ben, ${p.first_name} ${p.last_name}, bana uygulanacak "${s.sales.services.name}" işlemi hakkında bilgilendirildim. İşlemin amacı, olası riskleri ve alternatifleri anlatıldı. Sorularım yanıtlandı. İşlemin evde uygulanmasını kendi rızamla kabul ediyorum.`;
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex justify-between items-start">
          <div><Link href={`/hastalar/${p.id}`} className="text-xl font-semibold text-teal-700">{p.first_name} {p.last_name}</Link>
            <p className="text-sm text-slate-600">{s.sales.services.name} · Seans {s.seq}/{s.sales.session_count} · {dt(s.scheduled_at)}</p>
            <p className="text-sm"><a href={`tel:${p.phone}`} className="text-teal-700">{p.phone}</a>{p.address && ` · ${p.address}`}</p></div>
          <span className={`badge ${s.status === "tamamlandi" ? "bg-green-100 text-green-700" : s.status === "iptal" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{STATUS[s.status]}</span>
        </div>
        {an?.allergies && <p className="mt-2 text-sm bg-red-50 text-red-700 rounded-lg px-3 py-2">⚠️ Alerji: {an.allergies}</p>}
        {an?.medications && <p className="mt-1 text-sm text-slate-600">İlaçlar: {an.medications}</p>}
        {staff && s.status === "planlandi" && <form action={scheduleSession} className="flex gap-2 mt-3 flex-wrap"><input type="hidden" name="id" value={id} />
          <input name="scheduled_at" type="datetime-local" className="input flex-1 min-w-40" defaultValue={local} />
          <select name="nurse_id" className="input flex-1 min-w-32" defaultValue={s.nurse_id ?? ""}><option value="">Hemşire</option>{nurses?.map(n => <option key={n.id} value={n.id}>{n.full_name}</option>)}</select>
          <button className="btn-outline">Planla</button></form>}
      </div>

      <section className="card">
        <h2 className="font-medium mb-2">Vitaller {hasStart ? "✅" : "⬜"} Başlangıç · {hasEnd ? "✅" : "⬜"} Bitiş</h2>
        {!!vitals?.length && <div className="overflow-x-auto mb-3"><table className="text-sm w-full"><thead className="text-slate-500 text-xs"><tr><th className="text-left">Aşama</th><th>Saat</th><th>TA</th><th>Nabız</th><th>Ateş</th><th>SpO2</th><th>KŞ</th></tr></thead>
          <tbody>{vitals.map(v => <tr key={v.id} className="text-center border-t"><td className="text-left">{PHASE[v.phase]}</td><td>{new Date(v.measured_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</td><td>{v.bp_sys ?? "-"}/{v.bp_dia ?? "-"}</td><td>{v.pulse ?? "-"}</td><td>{v.temp ?? "-"}</td><td>{v.spo2 ?? "-"}</td><td>{v.glucose ?? "-"}</td></tr>)}</tbody></table></div>}
        {staff && s.status === "planlandi" && <form action={addVital} className="grid grid-cols-3 gap-2"><input type="hidden" name="session_id" value={id} />
          <select name="phase" className="input col-span-3" defaultValue={!hasStart ? "baslangic" : "ara"}><option value="baslangic">Başlangıç</option><option value="ara">Ara ölçüm</option><option value="bitis">Bitiş</option></select>
          <input name="bp_sys" type="number" inputMode="numeric" placeholder="Büyük TA" className="input" /><input name="bp_dia" type="number" inputMode="numeric" placeholder="Küçük TA" className="input" /><input name="pulse" type="number" inputMode="numeric" placeholder="Nabız" className="input" />
          <input name="temp" type="number" step="0.1" inputMode="decimal" placeholder="Ateş" className="input" /><input name="spo2" type="number" inputMode="numeric" placeholder="SpO2 %" className="input" /><input name="glucose" type="number" inputMode="numeric" placeholder="Kan şekeri" className="input" />
          <input name="notes" placeholder="Not" className="input col-span-3" /><button className="btn col-span-3">Ölçüm Ekle</button></form>}
      </section>

      <section className="card">
        <h2 className="font-medium mb-2">Onam {consent ? "✅" : "⬜"}</h2>
        {consent ? <p className="text-sm text-slate-600">{consent.signer_name} tarafından {dt(consent.signed_at)} imzalandı.</p>
          : staff && s.status === "planlandi" ? <ConsentPad sessionId={id} defaultName={`${p.first_name} ${p.last_name}`} text={CONSENT_TEXT} /> : <p className="text-sm text-slate-500">Onam alınmadı.</p>}
      </section>

      <section className="card">
        <h2 className="font-medium mb-2">Kullanılan Malzeme</h2>
        <ul className="text-sm divide-y mb-3">{moves?.map((m: any) => <li key={m.id} className="flex justify-between py-1.5"><span>{m.products.name} <span className="text-slate-500">× {-m.quantity}</span>{m.notes && <span className="text-xs text-slate-400"> · {m.notes}</span>}</span>
          {staff && s.status === "planlandi" && <form action={deleteStockMove.bind(null, m.id, id)}><button className="text-red-600 text-xs">Sil</button></form>}</li>)}
          {!moves?.length && <li className="py-1 text-slate-500">Henüz düşüm yok.</li>}</ul>
        {staff && s.status === "planlandi" && <>
          {!!kit?.length && !moves?.length && <form action={applyKit.bind(null, id)} className="mb-3"><button className="btn w-full">📦 Paket Düşüm Uygula ({kit.map((k: any) => `${k.quantity} ${k.products.name}`).join(", ")})</button></form>}
          <form action={addStockMove} className="flex gap-2"><input type="hidden" name="session_id" value={id} />
            <select name="product_id" className="input flex-1" required><option value="">Ürün seç…</option>{products?.map(x => <option key={x.id} value={x.id}>{x.name} (stok {x.stock})</option>)}</select>
            <input name="quantity" type="number" min={1} defaultValue={1} className="input w-20" /><button className="btn-outline">Ekle</button></form></>}
      </section>

      {staff && s.status === "planlandi" && <div className="flex gap-2">
        <form action={setSessionStatus.bind(null, id, "iptal", p.id)} className="flex-1"><button className="btn-danger w-full">İptal Et</button></form>
        <form action={setSessionStatus.bind(null, id, "tamamlandi", p.id)} className="flex-[2]"><button className="btn w-full" disabled={!canComplete}>{canComplete ? "✓ Seansı Tamamla" : "Başlangıç+bitiş vitali ve onam gerekli"}</button></form>
      </div>}
      {staff && s.status !== "planlandi" && <form action={setSessionStatus.bind(null, id, "planlandi", p.id)}><button className="btn-outline w-full">Yeniden Aç</button></form>}
    </div>
  );
}
