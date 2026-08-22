import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import { tl, dt, d, STATUS, METHOD } from "@/lib/format";
import { addPayment } from "@/lib/actions";
import PatientForm from "@/components/PatientForm";
export default async function Patient({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { id } = await params; const { edit } = await searchParams; const sb = await createClient(); const me = await getProfile();
  const { data: p } = await sb.from("patients").select("*, doctors(full_name)").eq("id", id).single();
  if (!p) notFound();
  const { data: doctors } = await sb.from("doctors").select("id, full_name").order("full_name");
  if (edit) return <div className="space-y-4"><h1 className="text-xl font-semibold">Hasta Düzenle</h1><PatientForm p={p} doctors={doctors ?? []} /></div>;
  const { data: an } = await sb.from("anamnesis").select("*").eq("patient_id", id).maybeSingle();
  const { data: sales } = await sb.from("sale_balances").select("*, services(name), sessions(id, seq, scheduled_at, status), payments(id, amount, method, paid_at)").eq("patient_id", id).order("created_at", { ascending: false });
  const staff = me?.role !== "hekim";
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex justify-between items-start">
          <div><h1 className="text-xl font-semibold">{p.first_name} {p.last_name}</h1>
            <p className="text-sm text-slate-600"><a href={`tel:${p.phone}`} className="text-teal-700">{p.phone}</a> · {p.nationality === "tc" ? `TC: ${p.tc_no ?? "—"}` : `Pasaport: ${p.passport_no ?? "—"}`} · Doğum: {d(p.birth_date)}</p>
            {p.doctors && <p className="text-sm text-slate-600">Hekim: {p.doctors.full_name}</p>}
            {p.address && <p className="text-sm text-slate-600">{p.address}</p>}</div>
          {staff && <Link href={`?edit=1`} className="btn-outline">Düzenle</Link>}
        </div>
      </div>
      <section className="card">
        <div className="flex justify-between items-center mb-2"><h2 className="font-medium">Anamnez</h2>{staff && <Link href={`/hastalar/${id}/anamnez`} className="text-sm text-teal-700">{an ? "Güncelle" : "+ Anamnez Al"}</Link>}</div>
        {!an ? <p className="text-sm text-amber-700">Henüz anamnez alınmamış.</p> : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-slate-500">Boy / Kilo</dt><dd>{an.height_cm ?? "—"} cm / {an.weight_kg ?? "—"} kg</dd>
            <dt className="text-slate-500">Alerji</dt><dd className={an.allergies ? "text-red-600 font-medium" : ""}>{an.allergies || "Yok"}</dd>
            <dt className="text-slate-500">Kronik Hastalık</dt><dd>{an.chronic_diseases || "—"}</dd>
            <dt className="text-slate-500">Kullandığı İlaçlar</dt><dd>{an.medications || "—"}</dd>
            <dt className="text-slate-500">Ameliyatlar</dt><dd>{an.surgeries || "—"}</dd>
            <dt className="text-slate-500">Klinik Öykü</dt><dd>{an.clinical_history || "—"}</dd>
            <dt className="text-slate-500">Özel Durum</dt><dd>{an.special_conditions || "—"}</dd>
            <dt className="text-slate-500">Diğer</dt><dd>{[an.smoking && "Sigara", an.alcohol && "Alkol", an.pregnancy && "Gebelik"].filter(Boolean).join(", ") || "—"}</dd>
          </dl>)}
      </section>
      <section className="space-y-3">
        <div className="flex justify-between items-center"><h2 className="font-medium">Satışlar & Seanslar</h2>{staff && <Link href={`/hastalar/${id}/satis`} className="btn">+ Satış</Link>}</div>
        {!sales?.length && <p className="card text-sm text-slate-500">Satış yok.</p>}
        {sales?.map((s: any) => (
          <div key={s.id} className="card space-y-3">
            <div className="flex justify-between"><div><b>{s.services.name}</b> · {s.session_count} seans × {tl(s.unit_price)}<div className="text-xs text-slate-500">{d(s.created_at)} · {s.payer === "kurum" ? "Kurum ödemeli (hekim tahsil eder)" : "Hasta öder"}</div></div>
              {staff && <div className="text-right text-sm"><div>Toplam {tl(s.total)}</div><div>Ödenen {tl(s.paid)}</div><div className={Number(s.balance) > 0 ? "text-red-600 font-semibold" : "text-green-700 font-semibold"}>Kalan {tl(s.balance)}</div></div>}</div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">{[...s.sessions].sort((a: any, b: any) => a.seq - b.seq).map((x: any) => (
              <li key={x.id}><Link href={`/seans/${x.id}`} className="flex justify-between items-center rounded-lg border px-3 py-2 text-sm">
                <span>Seans {x.seq} <span className="text-slate-500">· {dt(x.scheduled_at)}</span></span>
                <span className={`badge ${x.status === "tamamlandi" ? "bg-green-100 text-green-700" : x.status === "iptal" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{STATUS[x.status]}</span></Link></li>))}</ul>
            {staff && s.payer !== "kurum" && <details><summary className="text-sm text-teal-700 cursor-pointer">Ödemeler ({s.payments.length})</summary>
              <ul className="text-sm divide-y mt-2">{s.payments.map((pm: any) => <li key={pm.id} className="flex justify-between py-1"><span>{d(pm.paid_at)} · {METHOD[pm.method]}</span><b>{tl(pm.amount)}</b></li>)}</ul>
              {Number(s.balance) > 0 && <form action={addPayment} className="flex gap-2 mt-2 flex-wrap">
                <input type="hidden" name="sale_id" value={s.id} /><input type="hidden" name="patient_id" value={id} />
                <input name="amount" type="number" step="0.01" placeholder="Tutar" className="input flex-1 min-w-24" required defaultValue={s.balance} />
                <select name="method" className="input flex-1 min-w-24"><option value="nakit">Nakit</option><option value="kart">Kredi Kartı</option><option value="havale">Havale</option></select>
                <input name="paid_at" type="date" className="input flex-1 min-w-32" defaultValue={new Date().toISOString().slice(0, 10)} />
                <button className="btn">Ödeme Ekle</button></form>}</details>}
          </div>))}
      </section>
    </div>
  );
}
