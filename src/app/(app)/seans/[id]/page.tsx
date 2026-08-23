import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MapPin, AlertTriangle, Pill, Activity, FileSignature, Package, CheckCircle2, Circle, Plus, Trash2, CalendarClock, XCircle, RotateCcw, Check, Navigation, ClipboardList, NotebookPen, Pencil, FileText, IdCard } from "lucide-react";
import { createClient, getProfile } from "@/lib/supabase/server";
import { dt, t, toIstanbulInputValue, missingIdentityFields } from "@/lib/format";
import { addVital, updateVital, deleteVital, addStockMove, applyKit, applyMaterialKit, deleteStockMove, scheduleSession, setSessionStatus, saveSessionNotes, deleteConsent } from "@/lib/actions";
import ConsentPad from "@/components/ConsentPad";
import PatientIdentityModal from "@/components/PatientIdentityModal";
import { PageHeader, Card, StatusBadge, Alert, Field } from "@/components/ui";

const PHASE: Record<string, string> = { baslangic: "Başlangıç", ara: "Ara ölçüm", bitis: "Bitiş" };

function VitalInputs({ v }: { v?: any }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Büyük TA"><input name="bp_sys" type="number" inputMode="numeric" className="input px-3" placeholder="120" defaultValue={v?.bp_sys ?? ""} /></Field>
        <Field label="Küçük TA"><input name="bp_dia" type="number" inputMode="numeric" className="input px-3" placeholder="80" defaultValue={v?.bp_dia ?? ""} /></Field>
        <Field label="Nabız"><input name="pulse" type="number" inputMode="numeric" className="input px-3" placeholder="72" defaultValue={v?.pulse ?? ""} /></Field>
        <Field label="Solunum /dk"><input name="resp_rate" type="number" inputMode="numeric" className="input px-3" placeholder="16" defaultValue={v?.resp_rate ?? ""} /></Field>
        <Field label="Ateş °C"><input name="temp" type="number" step="0.1" inputMode="decimal" className="input px-3" placeholder="36.5" defaultValue={v?.temp ?? ""} /></Field>
        <Field label="SpO₂ %"><input name="spo2" type="number" inputMode="numeric" className="input px-3" placeholder="98" defaultValue={v?.spo2 ?? ""} /></Field>
        <Field label="Kan şekeri"><input name="glucose" type="number" inputMode="numeric" className="input px-3" placeholder="100" defaultValue={v?.glucose ?? ""} /></Field>
      </div>
      <Field label="Not"><input name="notes" className="input" placeholder="İsteğe bağlı" defaultValue={v?.notes ?? ""} /></Field>
    </>
  );
}

function VitalForm({ sessionId, phase }: { sessionId: string; phase: string }) {
  return (
    <form action={addVital} className="space-y-3"><input type="hidden" name="session_id" value={sessionId} /><input type="hidden" name="phase" value={phase} />
      <VitalInputs />
      <button className="btn w-full"><Plus className="size-4" />{PHASE[phase]} Ölçümünü Kaydet</button>
    </form>
  );
}

function VitalRow({ v, open, sessionId }: { v: any; open: boolean; sessionId: string }) {
  const cells = [["TA", v.bp_sys != null || v.bp_dia != null ? `${v.bp_sys ?? "-"}/${v.bp_dia ?? "-"}` : null], ["Nabız", v.pulse], ["Solunum", v.resp_rate], ["Ateş", v.temp], ["SpO₂", v.spo2 != null ? `%${v.spo2}` : null], ["KŞ", v.glucose]].filter(([, x]) => x != null && x !== "");
  const summary = (
    <div className="flex items-start gap-3 flex-1 min-w-0">
      <div className="w-14 shrink-0 text-xs"><div className="font-semibold">{PHASE[v.phase]}</div><div className="text-slate-500 num">{t(v.measured_at)}</div></div>
      <div className="flex-1 flex flex-wrap gap-1.5">{cells.map(([k, x]) => <span key={k as string} className="badge badge-slate num">{k} <b>{x as string}</b></span>)}{v.notes && <span className="text-xs text-slate-500 w-full">{v.notes}</span>}</div>
    </div>
  );
  if (!open) return <div className="flex items-start gap-3 py-2.5">{summary}</div>;
  return (
    <details>
      <summary className="flex items-start gap-3 py-2.5 cursor-pointer list-none">{summary}<Pencil className="size-4 text-slate-400 shrink-0 mt-0.5" /></summary>
      <div className="pl-[3.75rem] pr-1 pb-3 space-y-3">
        <form action={updateVital} className="space-y-3">
          <input type="hidden" name="id" value={v.id} /><input type="hidden" name="session_id" value={sessionId} />
          <VitalInputs v={v} />
          <button className="btn-secondary w-full">Kaydet</button>
        </form>
        <form action={deleteVital.bind(null, v.id, sessionId)}><button className="btn-danger w-full"><Trash2 className="size-4" />Sil</button></form>
      </div>
    </details>
  );
}

export default async function Session({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sb = await createClient(); const me = await getProfile();
  const { data: s } = await sb.from("sessions").select("*, patients(*), sales(session_count, service_id, encounter_id, services(name, requires_consent))").eq("id", id).single();
  if (!s) notFound();
  const staff = me?.role !== "hekim"; const open = staff && s.status === "planlandi"; const encId = s.sales.encounter_id;
  const [{ data: vitals }, { data: consent }, { data: moves }, { data: an }, { data: nurses }, { data: products }, { data: kit }, { data: materialKits }, { data: siblings }] = await Promise.all([
    sb.from("vitals").select("*").eq("session_id", id).order("measured_at"),
    sb.from("consents").select("*").eq("session_id", id).maybeSingle(),
    sb.from("stock_moves").select("*, products(name)").eq("session_id", id).order("created_at"),
    sb.from("anamnesis").select("allergies, medications, fistula_side").eq("patient_id", s.patient_id).maybeSingle(),
    sb.from("profiles").select("id, full_name").in("role", ["hemsire", "admin"]).eq("is_active", true),
    sb.from("product_stock").select("id, name, stock").eq("is_active", true).order("name"),
    sb.from("service_kits").select("quantity, products(name)").eq("service_id", s.sales.service_id),
    sb.from("material_kits").select("id, name, material_kit_items(quantity, products(name))").order("name"),
    sb.from("sessions").select("id, seq, status").eq("sale_id", s.sale_id).order("seq"),
  ]);
  const p = s.patients; const name = `${p.first_name} ${p.last_name}`;
  const start = vitals?.filter(v => v.phase === "baslangic") ?? []; const mid = vitals?.filter(v => v.phase === "ara") ?? []; const end = vitals?.filter(v => v.phase === "bitis") ?? [];
  const consentUrl = consent ? (await sb.storage.from("consents").createSignedUrl(consent.signature_path, 3600)).data?.signedUrl : null;
  const { data: rx } = encId ? await sb.from("prescriptions").select("file_path").eq("encounter_id", encId).order("created_at", { ascending: false }).limit(1) : { data: [] as any[] };
  const rxUrl = rx?.[0] ? (await sb.storage.from("prescriptions").createSignedUrl(rx[0].file_path, 3600)).data?.signedUrl : null;
  const needConsent = s.sales.services.requires_consent; const hasConsent = !!consent || !needConsent;
  const canComplete = start.length > 0 && end.length > 0 && hasConsent;
  const local = toIstanbulInputValue(s.scheduled_at);
  const CONSENT_TEXT = `Ben, ${name}, bana uygulanacak "${s.sales.services.name}" işlemi hakkında bilgilendirildim. İşlemin amacı, olası riskleri ve alternatifleri anlatıldı. Sorularım yanıtlandı. İşlemin evde uygulanmasını kendi rızamla kabul ediyorum.`;
  const steps = [{ ok: !!consent, label: "Onam", show: needConsent }, { ok: start.length > 0, label: "Başlangıç" }, { ok: (moves?.length ?? 0) > 0, label: "Malzeme" }, { ok: end.length > 0, label: "Bitiş" }].filter(x => x.show !== false);
  const exitTime = s.completed_at ? t(s.completed_at) : null;
  const Section = ({ n, icon: Icon, title, ok, children }: { n: number; icon: any; title: string; ok: boolean; children: React.ReactNode }) => (
    <details className="card">
      <summary className="flex items-center gap-2 px-4 sm:px-5 py-4 cursor-pointer">
        <span className={`size-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${ok ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}>{ok ? <Check className="size-3.5" /> : n}</span>
        <Icon className="size-4 text-brand-600 shrink-0" /><span className="card-title flex-1">{title}</span>
        {ok && <span className="text-sm font-medium text-emerald-700 shrink-0">Tamamlandı</span>}
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 pt-4">{children}</div>
    </details>
  );

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader back={encId ? `/muayene/${encId}` : `/hastalar/${p.id}`} title={name} subtitle={`${s.sales.services.name} · Seans ${s.seq}/${s.sales.session_count}${s.scheduled_at ? ` · ${dt(s.scheduled_at)}` : ""}${exitTime ? ` · Çıkış ${exitTime}` : ""}`}
        action={<div className="flex items-center gap-2">
          <Link href={`/hastalar/${p.id}/anamnez?back=/seans/${id}`} aria-label="Anamnez" className="btn-icon"><ClipboardList className="size-5" /></Link>
          {rxUrl && <a href={rxUrl} target="_blank" rel="noopener noreferrer" aria-label="Reçete" className="btn-icon"><FileText className="size-5" /></a>}
          <StatusBadge status={s.status} />
        </div>} />

      {/* Seans gezgini */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">{siblings?.map(x => <Link key={x.id} href={`/seans/${x.id}`} aria-current={x.id === id ? "page" : undefined} className={`size-9 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors ${x.id === id ? "bg-brand-600 border-brand-600 text-white" : x.status === "tamamlandi" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : x.status === "iptal" ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-white border-slate-200 text-slate-700"}`}>{x.seq}</Link>)}</div>

      <div className="grid grid-cols-2 gap-3">
        <a href={`tel:${p.phone}`} className="card p-3 flex items-center gap-3 hover:bg-slate-50"><span className="size-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Phone className="size-4" /></span><div className="min-w-0"><div className="text-[11px] text-slate-500">Ara</div><div className="text-sm font-semibold num truncate">{p.phone}</div></div></a>
        <a href={p.address ? `https://maps.google.com/?q=${encodeURIComponent(p.address)}` : undefined} target="_blank" className="card p-3 flex items-center gap-3 hover:bg-slate-50"><span className="size-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><Navigation className="size-4" /></span><div className="min-w-0"><div className="text-[11px] text-slate-500">Adres</div><div className="text-sm font-semibold truncate">{p.address ?? "—"}</div></div></a>
      </div>
      {an?.allergies && <Alert tone="danger"><AlertTriangle className="size-4 mt-0.5 shrink-0" /><span><b>Alerji:</b> {an.allergies}</span></Alert>}
      {an?.fistula_side && <Alert tone="warn"><AlertTriangle className="size-4 mt-0.5 shrink-0" /><span><b>Fistül:</b> {an.fistula_side === "sag" ? "Sağ kol" : "Sol kol"} — bu koldan TA ölçümü/iğne uygulamayın</span></Alert>}
      {an?.medications && <Alert tone="info"><Pill className="size-4 mt-0.5 shrink-0" /><span><b>İlaçlar:</b> {an.medications}</span></Alert>}
      {missingIdentityFields(p).length > 0 && <Alert tone="warn"><IdCard className="size-4 mt-0.5 shrink-0" /><span className="flex-1">Kimlik bilgileri eksik: {missingIdentityFields(p).join(", ")}</span><PatientIdentityModal p={p} back={`/seans/${id}`} /></Alert>}

      {open && <div className="card px-4 py-3 flex items-center justify-between gap-2">{steps.map((st, i) => <span key={st.label} className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium ${st.ok ? "text-emerald-700" : "text-slate-500"}`}>{st.ok ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}{st.label}{i < steps.length - 1 && <span className="hidden sm:block w-6 h-px bg-slate-200 ml-2" />}</span>)}</div>}

      <details className="card group" open={!s.scheduled_at}>
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm"><CalendarClock className="size-4 text-slate-500" /><span className="flex-1">{s.scheduled_at ? dt(s.scheduled_at) : "Planlanmadı"}{s.nurse_id && nurses?.find(n => n.id === s.nurse_id) && <span className="text-slate-500"> · {nurses.find(n => n.id === s.nurse_id)!.full_name}</span>}</span>{open && <span className="text-brand-700 font-medium">Değiştir</span>}</summary>
        {open && <form action={scheduleSession} className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end border-t border-slate-100 pt-3"><input type="hidden" name="id" value={id} />
          <Field label="Tarih & saat"><input name="scheduled_at" type="datetime-local" className="input" defaultValue={local} /></Field>
          <Field label="Hemşire"><select name="nurse_id" className="input" defaultValue={s.nurse_id ?? ""}><option value="">Seçiniz</option>{nurses?.map(n => <option key={n.id} value={n.id}>{n.full_name}</option>)}</select></Field>
          <button className="btn-secondary">Kaydet</button></form>}
      </details>

      {needConsent && <Section n={1} icon={FileSignature} title="Onam" ok={!!consent}>
        {consent ? (
          <div className="space-y-3">
            <Alert tone="success"><CheckCircle2 className="size-4 mt-0.5 shrink-0" /><span><b>{consent.signer_name}</b> · {dt(consent.signed_at)}</span></Alert>
            {consentUrl && <a href={consentUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-slate-200 overflow-hidden hover:border-brand-300 transition-colors">
              <img src={consentUrl} alt="Onam imzası" className="w-full max-h-40 object-contain bg-white" />
            </a>}
            {open && <form action={deleteConsent.bind(null, id, consent.signature_path)}><button className="btn-ghost btn-sm text-red-600 -ml-3"><Trash2 className="size-4" />Sil ve Yeniden Al</button></form>}
          </div>
        ) : open ? <ConsentPad sessionId={id} defaultName={name} text={CONSENT_TEXT} /> : <p className="text-sm text-slate-500">Onam alınmadı.</p>}
      </Section>}

      <Section n={needConsent ? 2 : 1} icon={Activity} title="Başlangıç Vitali" ok={start.length > 0}>
        {start.length > 0 && <div className="divide-rows">{start.map(v => <VitalRow key={v.id} v={v} open={open} sessionId={id} />)}</div>}
        {open && start.length === 0 && <VitalForm sessionId={id} phase="baslangic" />}
        {!open && start.length === 0 && <p className="text-sm text-slate-500">Ölçüm yok.</p>}
      </Section>

      <Section n={needConsent ? 3 : 2} icon={Package} title="Kullanılan Malzeme" ok={(moves?.length ?? 0) > 0}>
        <div className="space-y-3">
          {!!moves?.length && <ul className="divide-rows rounded-xl border border-slate-200">{moves.map((m: any) => <li key={m.id} className="flex items-center gap-3 px-3.5 py-2 text-sm"><span className="flex-1">{m.products.name}</span><span className="badge badge-slate num">× {-m.quantity}</span>{open && <form action={deleteStockMove.bind(null, m.id, id)}><button aria-label="Sil" className="btn-icon size-8 text-slate-400 hover:text-red-600"><Trash2 className="size-4" /></button></form>}</li>)}</ul>}
          {!moves?.length && !open && <p className="text-sm text-slate-500">Düşüm yapılmadı.</p>}
          {open && !!kit?.length && !moves?.length && <form action={applyKit.bind(null, id)}><button className="btn w-full"><Package className="size-4" />Hizmet Paketini Uygula</button><p className="hint text-center">{kit.map((k: any) => `${k.quantity} × ${k.products.name}`).join(", ")}</p></form>}
          {open && !!materialKits?.length && <form action={applyMaterialKit} className="space-y-1.5"><input type="hidden" name="session_id" value={id} />
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <Field label="Malzeme paketi"><select name="kit_id" className="input" required><option value="">Seçiniz</option>{materialKits.map((k: any) => <option key={k.id} value={k.id}>{k.name} · {k.material_kit_items.map((it: any) => `${it.quantity}×${it.products.name}`).join(", ")}</option>)}</select></Field>
              <button className="btn-secondary shrink-0"><Package className="size-4" />Uygula</button>
            </div>
            <p className="hint">Seçilen paketteki tüm ürünler tek seferde düşer</p>
          </form>}
          {open && <form action={addStockMove} className="grid grid-cols-[1fr_4.5rem_auto] gap-2 items-end"><input type="hidden" name="session_id" value={id} />
            <Field label="Ürün ekle"><select name="product_id" className="input" required><option value="">Seçiniz</option>{products?.map(x => <option key={x.id} value={x.id}>{x.name} ({x.stock})</option>)}</select></Field>
            <Field label="Adet"><input name="quantity" type="number" min={1} inputMode="numeric" defaultValue={1} className="input px-2" /></Field>
            <button className="btn-secondary" aria-label="Ekle"><Plus className="size-4" /></button></form>}
        </div>
      </Section>

      {(open || mid.length > 0) && <Card title={<span className="flex items-center gap-2 text-slate-600"><Activity className="size-4" />Ara Ölçümler <span className="text-xs font-normal text-slate-400">(isteğe bağlı)</span></span>}>
        {mid.length > 0 && <div className="divide-rows mb-3">{mid.map(v => <VitalRow key={v.id} v={v} open={open} sessionId={id} />)}</div>}
        {open && <details><summary className="btn-ghost btn-sm -ml-3 cursor-pointer"><Plus className="size-4" />Ara ölçüm ekle</summary><div className="mt-3"><VitalForm sessionId={id} phase="ara" /></div></details>}
      </Card>}

      <Section n={needConsent ? 4 : 3} icon={NotebookPen} title="Hemşire Gözlem Notu" ok={!!s.notes}>
        {s.notes && <p className="text-sm whitespace-pre-wrap mb-3">{s.notes}</p>}
        {open ? (
          <form action={saveSessionNotes} className="space-y-3"><input type="hidden" name="id" value={id} />
            <textarea name="notes" rows={3} className="input" defaultValue={s.notes ?? ""} placeholder="Hastanın genel durumu, gözlemler, uygulama sırasında yaşananlar…" />
            <button className="btn-secondary">Kaydet</button>
          </form>
        ) : !s.notes && <p className="text-sm text-slate-500">Not girilmedi.</p>}
      </Section>

      <Section n={needConsent ? 5 : 4} icon={Activity} title="Bitiş Vitali" ok={end.length > 0}>
        {end.length > 0 && <div className="divide-rows">{end.map(v => <VitalRow key={v.id} v={v} open={open} sessionId={id} />)}</div>}
        {open && end.length === 0 && <VitalForm sessionId={id} phase="bitis" />}
        {!open && end.length === 0 && <p className="text-sm text-slate-500">Ölçüm yok.</p>}
      </Section>

      {open && <div className="card card-pad flex gap-2">
        <form action={setSessionStatus.bind(null, id, "iptal", encId)}><button className="btn-danger"><XCircle className="size-4" /><span className="hidden sm:inline">İptal</span></button></form>
        <form action={setSessionStatus.bind(null, id, "tamamlandi", encId)} className="flex-1"><button className="btn w-full" disabled={!canComplete}><Check className="size-4" />Seansı Tamamla</button>{!canComplete && <p className="hint text-center">Tamamlamak için: {[needConsent && !consent && "onam", !start.length && "başlangıç vitali", !end.length && "bitiş vitali"].filter(Boolean).join(", ")}</p>}</form>
      </div>}
      {staff && s.status !== "planlandi" && <form action={setSessionStatus.bind(null, id, "planlandi", encId)}><button className="btn-secondary w-full"><RotateCcw className="size-4" />Seansı Yeniden Aç</button></form>}
    </div>
  );
}
