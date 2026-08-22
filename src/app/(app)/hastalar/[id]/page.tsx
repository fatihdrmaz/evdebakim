import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MapPin, Pencil, Plus, ClipboardList, AlertTriangle, Wallet, Stethoscope, CalendarClock, Receipt } from "lucide-react";
import { createClient, getProfile } from "@/lib/supabase/server";
import { tl, dt, d, METHOD } from "@/lib/format";
import { addPayment } from "@/lib/actions";
import PatientForm from "@/components/PatientForm";
import { PageHeader, Card, Avatar, StatusBadge, Empty, Alert, Field } from "@/components/ui";

function age(b?: string | null) { if (!b) return null; const a = Math.floor((Date.now() - new Date(b).getTime()) / 31557600000); return `${a} yaş`; }

export default async function Patient({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { id } = await params; const { edit } = await searchParams; const sb = await createClient(); const me = await getProfile();
  const { data: p } = await sb.from("patients").select("*, doctors(full_name)").eq("id", id).single();
  if (!p) notFound();
  const name = `${p.first_name} ${p.last_name}`;
  if (edit) {
    const { data: doctors } = await sb.from("doctors").select("id, full_name").order("full_name");
    return <div className="max-w-3xl"><PageHeader title="Hastayı Düzenle" subtitle={name} back={`/hastalar/${id}`} /><PatientForm p={p} doctors={doctors ?? []} /></div>;
  }
  const [{ data: an }, { data: sales }] = await Promise.all([
    sb.from("anamnesis").select("*").eq("patient_id", id).maybeSingle(),
    sb.from("sale_balances").select("*, services(name), sessions(id, seq, scheduled_at, status), payments(id, amount, method, paid_at)").eq("patient_id", id).order("created_at", { ascending: false }),
  ]);
  const staff = me?.role !== "hekim";
  const totalBalance = (sales ?? []).reduce((a: number, s: any) => a + Number(s.balance), 0);

  return (
    <div className="space-y-5">
      <PageHeader back="/hastalar" title={name} subtitle={[p.nationality === "tc" ? (p.tc_no ? `TC ${p.tc_no}` : "TC —") : `Pasaport ${p.passport_no ?? "—"}`, age(p.birth_date), p.gender === "K" ? "Kadın" : p.gender === "E" ? "Erkek" : null].filter(Boolean).join(" · ")}
        action={staff && <Link href="?edit=1" className="btn-secondary"><Pencil className="size-4" /><span className="hidden sm:inline">Düzenle</span></Link>} />

      <div className="grid sm:grid-cols-3 gap-3">
        <a href={`tel:${p.phone}`} className="card card-pad flex items-center gap-3 hover:bg-slate-50 transition-colors"><span className="size-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Phone className="size-5" /></span><div className="min-w-0"><div className="text-xs text-slate-500">Telefon</div><div className="font-semibold num truncate">{p.phone}</div></div></a>
        <div className="card card-pad flex items-center gap-3"><span className="size-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><Stethoscope className="size-5" /></span><div className="min-w-0"><div className="text-xs text-slate-500">Hekim</div><div className="font-semibold truncate">{p.doctors?.full_name ?? "—"}</div></div></div>
        <div className="card card-pad flex items-center gap-3"><span className="size-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><MapPin className="size-5" /></span><div className="min-w-0"><div className="text-xs text-slate-500">Adres</div><div className="font-semibold truncate">{p.address ?? "—"}</div></div></div>
      </div>

      <Card title="Anamnez" action={staff && <Link href={`/hastalar/${id}/anamnez`} className="btn-ghost btn-sm">{an ? <><Pencil className="size-4" />Güncelle</> : <><Plus className="size-4" />Anamnez Al</>}</Link>}>
        {!an ? <Alert tone="warn"><AlertTriangle className="size-4 mt-0.5 shrink-0" />Henüz anamnez alınmamış. İlk seanstan önce alınması önerilir.</Alert> : (
          <div className="space-y-3">
            {an.allergies && <Alert tone="danger"><AlertTriangle className="size-4 mt-0.5 shrink-0" /><span><b>Alerji:</b> {an.allergies}</span></Alert>}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[["Boy / Kilo", `${an.height_cm ?? "—"} cm / ${an.weight_kg ?? "—"} kg`], ["Kronik hastalıklar", an.chronic_diseases], ["Kullandığı ilaçlar", an.medications], ["Ameliyatlar", an.surgeries], ["Klinik öykü", an.clinical_history], ["Özel durumlar", an.special_conditions], ["Alışkanlıklar", [an.smoking && "Sigara", an.alcohol && "Alkol", an.pregnancy && "Gebelik"].filter(Boolean).join(", ")]].map(([k, v]) => (
                <div key={k as string}><dt className="text-xs font-medium text-slate-500">{k}</dt><dd className="text-slate-900 mt-0.5">{v || "—"}</dd></div>))}
            </dl>
            <p className="text-xs text-slate-400">Son güncelleme: {dt(an.updated_at)}</p>
          </div>)}
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Satışlar & Seanslar</h2>
        {staff && <Link href={`/hastalar/${id}/satis`} className="btn"><Plus className="size-4" />Yeni Satış</Link>}
      </div>
      {staff && totalBalance > 0 && <Alert tone="danger"><Wallet className="size-4 mt-0.5 shrink-0" />Toplam açık bakiye: <b className="num">{tl(totalBalance)}</b></Alert>}
      {!sales?.length && <Card><Empty icon={Receipt} title="Henüz satış yok" hint="Hizmet satışı oluşturunca seanslar otomatik açılır." /></Card>}
      {sales?.map((s: any) => (
        <Card key={s.id} title={<span className="flex items-center gap-2">{s.services.name}<span className="badge badge-slate">{s.session_count} seans</span></span>}
          action={<span className="text-sm text-slate-500">{d(s.created_at)}</span>}>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span><span className="text-slate-500">Seans fiyatı</span> <b className="num">{tl(s.unit_price)}</b></span>
              <span><span className="text-slate-500">Toplam</span> <b className="num">{tl(s.total)}</b></span>
              {s.payer === "kurum" ? <span className="badge badge-blue">Kurum ödemeli</span> : staff && <>
                <span><span className="text-slate-500">Ödenen</span> <b className="num text-emerald-700">{tl(s.paid)}</b></span>
                <span><span className="text-slate-500">Kalan</span> <b className={`num ${Number(s.balance) > 0 ? "text-red-600" : "text-emerald-700"}`}>{tl(s.balance)}</b></span></>}
              <span className="ml-auto text-slate-500">{s.done_sessions}/{s.session_count} tamamlandı</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(s.done_sessions / s.session_count) * 100}%` }} /></div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">{[...s.sessions].sort((a: any, b: any) => a.seq - b.seq).map((x: any) => (
              <li key={x.id}><Link href={`/seans/${x.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 hover:bg-slate-50 transition-colors">
                <span className={`size-8 rounded-lg flex items-center justify-center text-sm font-bold ${x.status === "tamamlandi" ? "bg-emerald-50 text-emerald-700" : x.status === "iptal" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>{x.seq}</span>
                <span className="flex-1 min-w-0 text-sm"><span className="flex items-center gap-1 text-slate-600"><CalendarClock className="size-3.5" />{x.scheduled_at ? dt(x.scheduled_at) : "Planlanmadı"}</span></span>
                <StatusBadge status={x.status} /></Link></li>))}</ul>
            {staff && s.payer !== "kurum" && (
              <details className="group">
                <summary className="btn-ghost btn-sm -ml-3 cursor-pointer"><Wallet className="size-4" />Ödemeler ({s.payments.length})</summary>
                <div className="mt-3 space-y-3">
                  {!!s.payments.length && <ul className="divide-rows rounded-xl border border-slate-200">{s.payments.map((pm: any) => <li key={pm.id} className="flex justify-between px-3.5 py-2.5 text-sm"><span>{d(pm.paid_at)} <span className="text-slate-500">· {METHOD[pm.method]}</span></span><b className="num">{tl(pm.amount)}</b></li>)}</ul>}
                  {Number(s.balance) > 0 && <form action={addPayment} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                    <input type="hidden" name="sale_id" value={s.id} /><input type="hidden" name="patient_id" value={id} />
                    <Field label="Tutar (₺)"><input name="amount" type="number" step="0.01" inputMode="decimal" className="input" required defaultValue={s.balance} /></Field>
                    <Field label="Yöntem"><select name="method" className="input"><option value="nakit">Nakit</option><option value="kart">Kredi Kartı</option><option value="havale">Havale</option></select></Field>
                    <Field label="Tarih"><input name="paid_at" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
                    <button className="btn"><Plus className="size-4" />Ödeme Ekle</button></form>}
                </div>
              </details>)}
          </div>
        </Card>))}
    </div>
  );
}
