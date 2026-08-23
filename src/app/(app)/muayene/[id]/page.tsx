import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MapPin, Plus, Pencil, AlertTriangle, Wallet, Stethoscope, Activity, CalendarClock, Receipt, ClipboardList, Lock, Unlock, CheckCircle2 } from "lucide-react";
import { createClient, getProfile } from "@/lib/supabase/server";
import { tl, dt, d, METHOD } from "@/lib/format";
import { addPayment, updateEncounter, setEncounterStatus, createSale } from "@/lib/actions";
import QuickPlanner from "@/components/QuickPlanner";
import SaleForm from "@/components/SaleForm";
import { PageHeader, Card, StatusBadge, Empty, Alert, Field } from "@/components/ui";

const PHASE: Record<string, string> = { baslangic: "Başlangıç", ara: "Ara ölçüm", bitis: "Bitiş" };

export default async function Encounter({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sb = await createClient(); const me = await getProfile();
  const { data: e } = await sb.from("encounters").select("*, patients(*), doctors(full_name)").eq("id", id).single();
  if (!e) notFound();
  const p = e.patients; const name = `${p.first_name} ${p.last_name}`; const staff = me?.role !== "hekim"; const open = e.status === "acik";
  const [{ data: an }, { data: sales }, { data: doctors }, { data: nurses }, { data: services }, { data: history }] = await Promise.all([
    sb.from("anamnesis").select("*").eq("patient_id", p.id).maybeSingle(),
    sb.from("sale_balances").select("*, services(name), sessions(id, seq, scheduled_at, status, nurse_id), payments(id, amount, method, paid_at)").eq("encounter_id", id).order("created_at"),
    sb.from("doctors").select("id, full_name").order("full_name"),
    sb.from("profiles").select("id, full_name").in("role", ["hemsire", "admin"]).eq("is_active", true),
    sb.from("services").select("id, name, default_price").eq("is_active", true).order("name"),
    sb.from("encounters").select("id, opened_at, status, complaint, diagnosis").eq("patient_id", p.id).neq("id", id).order("opened_at", { ascending: false }).limit(5),
  ]);
  const totalBalance = (sales ?? []).reduce((a: number, s: any) => a + Number(s.balance), 0);
  const allSessions = (sales ?? []).flatMap((s: any) => s.sessions);
  const doneCount = allSessions.filter((x: any) => x.status === "tamamlandi").length;
  const sessionIds = allSessions.map((x: any) => x.id);
  const seqBySession = Object.fromEntries(allSessions.map((x: any) => [x.id, x.seq]));
  const { data: recentVitals } = sessionIds.length
    ? await sb.from("vitals").select("*").in("session_id", sessionIds).order("measured_at", { ascending: false }).limit(6)
    : { data: [] as any[] };

  return (
    <div className="space-y-5">
      <PageHeader back={`/hastalar/${p.id}`} title={<span className="flex items-center gap-2 flex-wrap">{name}<span className={`badge ${open ? "badge-green" : "badge-slate"}`}>{open ? "Açık muayene" : "Kapalı"}</span></span>}
        subtitle={`Muayene · ${d(e.opened_at)}${e.doctors ? ` · ${e.doctors.full_name}` : ""}`}
        action={staff && (open ? <form action={setEncounterStatus.bind(null, id, "kapali")}><button className="btn-secondary"><Lock className="size-4" /><span className="hidden sm:inline">Kapat</span></button></form> : <form action={setEncounterStatus.bind(null, id, "acik")}><button className="btn-secondary"><Unlock className="size-4" /><span className="hidden sm:inline">Yeniden Aç</span></button></form>)} />

      <div className="grid grid-cols-2 gap-3">
        <a href={`tel:${p.phone}`} className="card card-pad flex items-center gap-3 hover:bg-slate-50"><span className="size-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Phone className="size-5" /></span><div className="min-w-0"><div className="text-xs text-slate-500">Telefon</div><div className="font-semibold num truncate">{p.phone}</div></div></a>
        <div className="card card-pad flex items-center gap-3"><span className="size-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><MapPin className="size-5" /></span><div className="min-w-0"><div className="text-xs text-slate-500">Adres</div><div className="font-semibold truncate">{p.address ?? "—"}</div></div></div>
      </div>
      {an?.allergies && <Alert tone="danger"><AlertTriangle className="size-4 mt-0.5 shrink-0" /><span><b>Alerji:</b> {an.allergies}</span></Alert>}
      {!an && <Alert tone="warn"><ClipboardList className="size-4 mt-0.5 shrink-0" /><span className="flex-1">Anamnez alınmamış.</span><Link href={`/hastalar/${p.id}/anamnez?back=/muayene/${id}`} className="font-semibold underline">Şimdi al</Link></Alert>}

      <div className="grid lg:grid-cols-[1fr_20rem] gap-5 items-start">
        <div className="space-y-5">
          <details className="card" open>
            <summary className="flex items-center gap-2 px-4 sm:px-5 py-4 cursor-pointer"><Stethoscope className="size-4 text-brand-600 shrink-0" /><span className="card-title">Muayene Bilgileri</span><span className="flex-1 text-sm text-slate-500 truncate ml-1">{e.complaint ?? (open ? "Şikayet girilmedi" : "")}</span><span className="text-sm font-medium text-brand-700 shrink-0">Gizle / Göster</span></summary>
            <form action={updateEncounter} className="space-y-3 px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 pt-4"><input type="hidden" name="id" value={id} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tarih"><input name="opened_at" type="date" className="input" defaultValue={e.opened_at} disabled={!open} /></Field>
                <Field label="Hekim"><select name="doctor_id" className="input" defaultValue={e.doctor_id ?? ""} disabled={!open}><option value="">Seçiniz</option>{doctors?.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}</select></Field>
              </div>
              <Field label="Başvuru nedeni / şikayet"><textarea name="complaint" rows={2} className="input" defaultValue={e.complaint ?? ""} disabled={!open} placeholder="Hastanın şikayeti, hekimin yönlendirme nedeni" /></Field>
              <Field label="Tanı / hekim notu"><textarea name="diagnosis" rows={2} className="input" defaultValue={e.diagnosis ?? ""} disabled={!open} /></Field>
              <Field label="Tedavi planı"><textarea name="plan" rows={2} className="input" defaultValue={e.plan ?? ""} disabled={!open} placeholder="Örn. 5 gün serum, günde 1" /></Field>
              <Field label="Not"><input name="notes" className="input" defaultValue={e.notes ?? ""} disabled={!open} /></Field>
              {open && staff && <button className="btn-secondary">Kaydet</button>}
            </form>
          </details>

          <Card title={<span className="flex items-center gap-2"><Activity className="size-4 text-brand-600" />Vital Bulgular</span>}>
            {!recentVitals?.length ? <p className="text-sm text-slate-500">Bu muayeneye bağlı hiçbir seansta ölçüm girilmedi.</p> : (
              <ul className="divide-rows">{recentVitals.map((v: any) => {
                const cells = [["TA", v.bp_sys != null || v.bp_dia != null ? `${v.bp_sys ?? "-"}/${v.bp_dia ?? "-"}` : null], ["Nabız", v.pulse], ["Ateş", v.temp], ["SpO₂", v.spo2 != null ? `%${v.spo2}` : null], ["KŞ", v.glucose]].filter(([, x]) => x != null && x !== "");
                return (
                  <li key={v.id} className="flex items-start gap-3 py-2.5">
                    <Link href={`/seans/${v.session_id}`} className="w-20 shrink-0 text-xs hover:underline">
                      <div className="font-semibold">Seans {seqBySession[v.session_id] ?? "—"}</div>
                      <div className="text-slate-500">{PHASE[v.phase] ?? v.phase}</div>
                    </Link>
                    <div className="flex-1 flex flex-wrap gap-1.5">{cells.map(([k, x]) => <span key={k as string} className="badge badge-slate num">{k} <b>{x as string}</b></span>)}{v.notes && <span className="text-xs text-slate-500 w-full">{v.notes}</span>}</div>
                  </li>);
              })}</ul>)}
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Hizmetler & Seanslar <span className="text-sm font-medium text-slate-500">{doneCount}/{allSessions.length}</span></h2>
          </div>
          {staff && totalBalance > 0 && <Alert tone="danger"><Wallet className="size-4 mt-0.5 shrink-0" />Açık bakiye: <b className="num">{tl(totalBalance)}</b></Alert>}
          {staff && open && (
            <details className="card">
              <summary className="flex items-center gap-2 px-4 sm:px-5 py-3.5 cursor-pointer"><Plus className="size-4 text-brand-600 shrink-0" /><span className="card-title flex-1">Hizmet Ekle</span></summary>
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 pt-4"><SaleForm patientId={p.id} encounterId={id} services={services ?? []} action={createSale} /></div>
            </details>
          )}
          {!sales?.length && <Card><Empty icon={Receipt} title="Henüz hizmet eklenmedi" hint="Yukarıdan hizmet ekleyin; seanslar otomatik açılır, sonra hızlı planlama ile günlere dağıtın." /></Card>}
          {sales?.map((s: any) => {
            const sess = [...s.sessions].sort((a: any, b: any) => a.seq - b.seq); const unsched = sess.filter((x: any) => !x.scheduled_at && x.status === "planlandi").length; const openSess = sess.filter((x: any) => x.status === "planlandi").length;
            return (
              <Card key={s.id} title={<span className="flex items-center gap-2">{s.services.name}<span className="badge badge-slate">{s.session_count} seans</span></span>} action={<span className="text-sm text-slate-500">{d(s.created_at)}</span>}>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                    <span><span className="text-slate-500">Seans</span> <b className="num">{tl(s.unit_price)}</b></span>
                    <span><span className="text-slate-500">Toplam</span> <b className="num">{tl(s.total)}</b></span>
                    {s.payer === "kurum" ? <span className="badge badge-blue">Kurum ödemeli</span> : staff && <><span><span className="text-slate-500">Ödenen</span> <b className="num text-emerald-700">{tl(s.paid)}</b></span><span><span className="text-slate-500">Kalan</span> <b className={`num ${Number(s.balance) > 0 ? "text-red-600" : "text-emerald-700"}`}>{tl(s.balance)}</b></span></>}
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(s.done_sessions / s.session_count) * 100}%` }} /></div>
                  {staff && open && openSess > 0 && <QuickPlanner saleId={s.id} encounterId={id} nurses={nurses ?? []} unscheduled={unsched} total={openSess} defaultNurse={sess.find((x: any) => x.nurse_id)?.nurse_id} />}
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">{sess.map((x: any) => (
                    <li key={x.id}><Link href={`/seans/${x.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 hover:bg-slate-50 transition-colors">
                      <span className={`size-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${x.status === "tamamlandi" ? "bg-emerald-50 text-emerald-700" : x.status === "iptal" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>{x.seq}</span>
                      <span className="flex-1 min-w-0 text-sm flex items-center gap-1 text-slate-600"><CalendarClock className="size-3.5 shrink-0" /><span className="truncate">{x.scheduled_at ? dt(x.scheduled_at) : "Planlanmadı"}</span></span>
                      <StatusBadge status={x.status} /></Link></li>))}</ul>
                  {staff && s.payer !== "kurum" && (
                    <details>
                      <summary className="btn-ghost btn-sm -ml-3 cursor-pointer"><Wallet className="size-4" />Ödemeler ({s.payments.length})</summary>
                      <div className="mt-3 space-y-3">
                        {!!s.payments.length && <ul className="divide-rows rounded-xl border border-slate-200">{s.payments.map((pm: any) => <li key={pm.id} className="flex justify-between px-3.5 py-2.5 text-sm"><span>{d(pm.paid_at)} <span className="text-slate-500">· {METHOD[pm.method]}</span></span><b className="num">{tl(pm.amount)}</b></li>)}</ul>}
                        {Number(s.balance) > 0 && <form action={addPayment} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                          <input type="hidden" name="sale_id" value={s.id} /><input type="hidden" name="encounter_id" value={id} />
                          <Field label="Tutar (₺)"><input name="amount" type="number" step="0.01" inputMode="decimal" className="input" required defaultValue={s.balance} /></Field>
                          <Field label="Yöntem"><select name="method" className="input"><option value="nakit">Nakit</option><option value="kart">Kredi Kartı</option><option value="havale">Havale</option></select></Field>
                          <Field label="Tarih"><input name="paid_at" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
                          <button className="btn"><Plus className="size-4" />Ödeme Ekle</button></form>}
                      </div>
                    </details>)}
                </div>
              </Card>);
          })}
        </div>

        <div className="space-y-5">
          <Card title="Anamnez Özeti" action={staff && <Link href={`/hastalar/${p.id}/anamnez?back=/muayene/${id}`} className="btn-ghost btn-sm"><Pencil className="size-4" />{an ? "Güncelle" : "Al"}</Link>}>
            {!an ? <p className="text-sm text-slate-500">Kayıt yok.</p> : (
              <dl className="space-y-2.5 text-sm">
                {[["Boy / Kilo", `${an.height_cm ?? "—"} cm / ${an.weight_kg ?? "—"} kg`], ["Kronik", an.chronic_diseases], ["İlaçlar", an.medications], ["Ameliyat", an.surgeries], ["Özel durum", an.special_conditions]].map(([k, v]) => (
                  <div key={k as string}><dt className="text-xs font-medium text-slate-500">{k}</dt><dd>{v || "—"}</dd></div>))}
              </dl>)}
          </Card>
          <Card title="Önceki Muayeneler">
            {!history?.length ? <p className="text-sm text-slate-500">İlk muayene.</p> : (
              <ul className="space-y-1.5">{history.map((h: any) => <li key={h.id}><Link href={`/muayene/${h.id}`} className="flex items-start gap-2 rounded-lg px-2 py-2 -mx-2 hover:bg-slate-50 text-sm"><CheckCircle2 className={`size-4 shrink-0 mt-0.5 ${h.status === "acik" ? "text-amber-500" : "text-emerald-600"}`} /><span className="min-w-0"><span className="num block">{d(h.opened_at)}</span><span className="text-slate-500 truncate block">{h.diagnosis ?? h.complaint ?? "—"}</span></span></Link></li>)}</ul>)}
          </Card>
        </div>
      </div>
    </div>
  );
}
