import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MapPin, AlertTriangle, Pill, Activity, FileSignature, Package, CheckCircle2, Circle, Plus, Trash2, CalendarClock, XCircle, RotateCcw, Check } from "lucide-react";
import { createClient, getProfile } from "@/lib/supabase/server";
import { dt } from "@/lib/format";
import { addVital, addStockMove, applyKit, deleteStockMove, scheduleSession, setSessionStatus } from "@/lib/actions";
import ConsentPad from "@/components/ConsentPad";
import { PageHeader, Card, StatusBadge, Alert, Field } from "@/components/ui";

const PHASE: Record<string, string> = { baslangic: "Başlangıç", ara: "Ara", bitis: "Bitiş" };
const Step = ({ ok, label }: { ok: boolean; label: string }) => <span className={`inline-flex items-center gap-1.5 text-sm ${ok ? "text-emerald-700" : "text-slate-500"}`}>{ok ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}{label}</span>;

export default async function Session({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sb = await createClient(); const me = await getProfile();
  const { data: s } = await sb.from("sessions").select("*, patients(*), sales(session_count, service_id, services(name, requires_consent))").eq("id", id).single();
  if (!s) notFound();
  const staff = me?.role !== "hekim"; const open = staff && s.status === "planlandi";
  const [{ data: vitals }, { data: consent }, { data: moves }, { data: an }, { data: nurses }, { data: products }, { data: kit }] = await Promise.all([
    sb.from("vitals").select("*").eq("session_id", id).order("measured_at"),
    sb.from("consents").select("*").eq("session_id", id).maybeSingle(),
    sb.from("stock_moves").select("*, products(name)").eq("session_id", id).order("created_at"),
    sb.from("anamnesis").select("allergies, medications").eq("patient_id", s.patient_id).maybeSingle(),
    sb.from("profiles").select("id, full_name").in("role", ["hemsire", "admin"]).eq("is_active", true),
    sb.from("product_stock").select("id, name, stock").eq("is_active", true).order("name"),
    sb.from("service_kits").select("quantity, products(name)").eq("service_id", s.sales.service_id),
  ]);
  const p = s.patients; const name = `${p.first_name} ${p.last_name}`;
  const hasStart = !!vitals?.some(v => v.phase === "baslangic"); const hasEnd = !!vitals?.some(v => v.phase === "bitis");
  const needConsent = s.sales.services.requires_consent; const hasConsent = !!consent || !needConsent;
  const canComplete = hasStart && hasEnd && hasConsent;
  const local = s.scheduled_at ? new Date(new Date(s.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
  const CONSENT_TEXT = `Ben, ${name}, bana uygulanacak "${s.sales.services.name}" işlemi hakkında bilgilendirildim. İşlemin amacı, olası riskleri ve alternatifleri anlatıldı. Sorularım yanıtlandı. İşlemin evde uygulanmasını kendi rızamla kabul ediyorum.`;

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader back={`/hastalar/${p.id}`} title={name} subtitle={`${s.sales.services.name} · Seans ${s.seq}/${s.sales.session_count}`} action={<StatusBadge status={s.status} />} />

      <div className="grid grid-cols-2 gap-3">
        <a href={`tel:${p.phone}`} className="card card-pad flex items-center gap-3 hover:bg-slate-50"><span className="size-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Phone className="size-5" /></span><div className="min-w-0"><div className="text-xs text-slate-500">Ara</div><div className="font-semibold num truncate">{p.phone}</div></div></a>
        <div className="card card-pad flex items-center gap-3"><span className="size-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><MapPin className="size-5" /></span><div className="min-w-0"><div className="text-xs text-slate-500">Adres</div><div className="font-semibold truncate">{p.address ?? "—"}</div></div></div>
      </div>
      {an?.allergies && <Alert tone="danger"><AlertTriangle className="size-4 mt-0.5 shrink-0" /><span><b>Alerji:</b> {an.allergies}</span></Alert>}
      {an?.medications && <Alert tone="info"><Pill className="size-4 mt-0.5 shrink-0" /><span><b>İlaçlar:</b> {an.medications}</span></Alert>}

      <Card title="Planlama">
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3"><CalendarClock className="size-4" />{s.scheduled_at ? dt(s.scheduled_at) : "Henüz planlanmadı"}</div>
        {open && <form action={scheduleSession} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end"><input type="hidden" name="id" value={id} />
          <Field label="Tarih & saat"><input name="scheduled_at" type="datetime-local" className="input" defaultValue={local} /></Field>
          <Field label="Hemşire"><select name="nurse_id" className="input" defaultValue={s.nurse_id ?? ""}><option value="">Seçiniz</option>{nurses?.map(n => <option key={n.id} value={n.id}>{n.full_name}</option>)}</select></Field>
          <button className="btn-secondary">Kaydet</button></form>}
      </Card>

      {staff && s.status === "planlandi" && <div className="card card-pad flex flex-wrap gap-x-5 gap-y-2"><Step ok={hasStart} label="Başlangıç vitali" /><Step ok={hasEnd} label="Bitiş vitali" />{needConsent && <Step ok={!!consent} label="Onam" />}<Step ok={!!moves?.length} label="Malzeme düşümü" /></div>}

      <Card title={<span className="flex items-center gap-2"><Activity className="size-4 text-brand-600" />Vitaller</span>} flush>
        {!!vitals?.length && <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>Aşama</th><th>Saat</th><th>TA</th><th>Nabız</th><th>Ateş</th><th>SpO₂</th><th>KŞ</th></tr></thead>
          <tbody>{vitals.map(v => <tr key={v.id} className="num"><td className="font-medium">{PHASE[v.phase]}</td><td>{new Date(v.measured_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</td><td>{v.bp_sys ?? "-"}/{v.bp_dia ?? "-"}</td><td>{v.pulse ?? "-"}</td><td>{v.temp ?? "-"}</td><td>{v.spo2 ?? "-"}</td><td>{v.glucose ?? "-"}</td></tr>)}</tbody></table></div>}
        {!vitals?.length && !open && <p className="px-5 pb-5 text-sm text-slate-500">Ölçüm girilmemiş.</p>}
        {open && <form action={addVital} className="px-4 sm:px-5 pb-4 sm:pb-5 pt-4 border-t border-slate-100 space-y-3"><input type="hidden" name="session_id" value={id} />
          <Field label="Aşama"><select name="phase" className="input" defaultValue={!hasStart ? "baslangic" : !hasEnd ? "bitis" : "ara"}><option value="baslangic">Başlangıç</option><option value="ara">Ara ölçüm</option><option value="bitis">Bitiş</option></select></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Büyük TA"><input name="bp_sys" type="number" inputMode="numeric" className="input" placeholder="120" /></Field>
            <Field label="Küçük TA"><input name="bp_dia" type="number" inputMode="numeric" className="input" placeholder="80" /></Field>
            <Field label="Nabız"><input name="pulse" type="number" inputMode="numeric" className="input" placeholder="72" /></Field>
            <Field label="Ateş °C"><input name="temp" type="number" step="0.1" inputMode="decimal" className="input" placeholder="36.5" /></Field>
            <Field label="SpO₂ %"><input name="spo2" type="number" inputMode="numeric" className="input" placeholder="98" /></Field>
            <Field label="Kan şekeri"><input name="glucose" type="number" inputMode="numeric" className="input" placeholder="100" /></Field>
          </div>
          <Field label="Not"><input name="notes" className="input" /></Field>
          <button className="btn w-full"><Plus className="size-4" />Ölçüm Ekle</button></form>}
      </Card>

      {needConsent && <Card title={<span className="flex items-center gap-2"><FileSignature className="size-4 text-brand-600" />Onam Formu</span>}>
        {consent ? <Alert tone="success"><CheckCircle2 className="size-4 mt-0.5 shrink-0" /><span><b>{consent.signer_name}</b> tarafından {dt(consent.signed_at)} tarihinde imzalandı.</span></Alert>
          : open ? <ConsentPad sessionId={id} defaultName={name} text={CONSENT_TEXT} /> : <p className="text-sm text-slate-500">Onam alınmadı.</p>}
      </Card>}

      <Card title={<span className="flex items-center gap-2"><Package className="size-4 text-brand-600" />Kullanılan Malzeme</span>} flush>
        {!!moves?.length && <ul className="divide-rows">{moves.map((m: any) => <li key={m.id} className="flex items-center gap-3 px-4 sm:px-5 py-2.5 text-sm"><span className="flex-1">{m.products.name}{m.notes && <span className="text-xs text-slate-400"> · {m.notes}</span>}</span><span className="badge badge-slate num">× {-m.quantity}</span>
          {open && <form action={deleteStockMove.bind(null, m.id, id)}><button aria-label="Sil" className="btn-icon size-9 text-slate-400 hover:text-red-600"><Trash2 className="size-4" /></button></form>}</li>)}</ul>}
        {!moves?.length && !open && <p className="px-5 pb-5 text-sm text-slate-500">Düşüm yapılmadı.</p>}
        {open && <div className={`px-4 sm:px-5 pb-4 sm:pb-5 pt-4 space-y-3 ${moves?.length ? "border-t border-slate-100" : ""}`}>
          {!!kit?.length && !moves?.length && <form action={applyKit.bind(null, id)}><button className="btn w-full"><Package className="size-4" />Paket Düşüm Uygula</button><p className="hint text-center">{kit.map((k: any) => `${k.quantity} × ${k.products.name}`).join(", ")}</p></form>}
          <form action={addStockMove} className="grid grid-cols-[1fr_5rem_auto] gap-2 items-end"><input type="hidden" name="session_id" value={id} />
            <Field label="Ürün"><select name="product_id" className="input" required><option value="">Seçiniz</option>{products?.map(x => <option key={x.id} value={x.id}>{x.name} ({x.stock})</option>)}</select></Field>
            <Field label="Adet"><input name="quantity" type="number" min={1} inputMode="numeric" defaultValue={1} className="input" /></Field>
            <button className="btn-secondary" aria-label="Ekle"><Plus className="size-4" /></button></form></div>}
      </Card>

      {open && <div className="card card-pad flex gap-2">
        <form action={setSessionStatus.bind(null, id, "iptal", p.id)}><button className="btn-danger"><XCircle className="size-4" /><span className="hidden sm:inline">İptal</span></button></form>
        <form action={setSessionStatus.bind(null, id, "tamamlandi", p.id)} className="flex-1"><button className="btn w-full" disabled={!canComplete} title={canComplete ? "" : "Başlangıç + bitiş vitali ve onam gerekli"}><Check className="size-4" />Seansı Tamamla</button></form>
      </div>}
      {staff && s.status !== "planlandi" && <form action={setSessionStatus.bind(null, id, "planlandi", p.id)}><button className="btn-secondary w-full"><RotateCcw className="size-4" />Seansı Yeniden Aç</button></form>}
    </div>
  );
}
