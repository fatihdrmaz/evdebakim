import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MapPin, Pencil, Plus, AlertTriangle, Stethoscope, ClipboardList, FolderOpen } from "lucide-react";
import { createClient, getProfile } from "@/lib/supabase/server";
import { d, dt } from "@/lib/format";
import { createEncounter } from "@/lib/actions";
import PatientForm from "@/components/PatientForm";
import { PageHeader, Card, Empty, Alert, Field } from "@/components/ui";

function age(b?: string | null) { if (!b) return null; return `${Math.floor((Date.now() - new Date(b).getTime()) / 31557600000)} yaş`; }

export default async function Patient({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string; yeni?: string }> }) {
  const { id } = await params; const { edit, yeni } = await searchParams; const sb = await createClient(); const me = await getProfile();
  const { data: p } = await sb.from("patients").select("*, doctors(full_name)").eq("id", id).single();
  if (!p) notFound();
  const name = `${p.first_name} ${p.last_name}`; const staff = me?.role !== "hekim";
  const { data: doctors } = await sb.from("doctors").select("id, full_name").order("full_name");
  if (edit) return <div className="max-w-3xl"><PageHeader title="Hastayı Düzenle" subtitle={name} back={`/hastalar/${id}`} /><PatientForm p={p} doctors={doctors ?? []} /></div>;
  const [{ data: an }, { data: encs }] = await Promise.all([
    sb.from("anamnesis").select("*").eq("patient_id", id).maybeSingle(),
    sb.from("encounters").select("*, doctors(full_name), sales(session_count, services(name), sessions(status))").eq("patient_id", id).order("opened_at", { ascending: false }),
  ]);
  const hasOpen = (encs ?? []).some((e: any) => e.status === "acik");

  return (
    <div className="space-y-5">
      <PageHeader back="/hastalar" title={name} subtitle={[p.nationality === "tc" ? (p.tc_no ? `TC ${p.tc_no}` : "TC —") : `Pasaport ${p.passport_no ?? "—"}`, age(p.birth_date), p.gender === "K" ? "Kadın" : p.gender === "E" ? "Erkek" : null].filter(Boolean).join(" · ")}
        action={staff && <Link href="?edit=1" className="btn-secondary"><Pencil className="size-4" /><span className="hidden sm:inline">Düzenle</span></Link>} />

      <div className="grid sm:grid-cols-3 gap-3">
        <a href={`tel:${p.phone}`} className="card card-pad flex items-center gap-3 hover:bg-slate-50 transition-colors"><span className="size-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Phone className="size-5" /></span><div className="min-w-0"><div className="text-xs text-slate-500">Telefon</div><div className="font-semibold num truncate">{p.phone}</div></div></a>
        <div className="card card-pad flex items-center gap-3"><span className="size-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><Stethoscope className="size-5" /></span><div className="min-w-0"><div className="text-xs text-slate-500">Hekim</div><div className="font-semibold truncate">{p.doctors?.full_name ?? "—"}</div></div></div>
        <div className="card card-pad flex items-center gap-3"><span className="size-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><MapPin className="size-5" /></span><div className="min-w-0"><div className="text-xs text-slate-500">Adres</div><div className="font-semibold truncate">{p.address ?? "—"}</div></div></div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Muayeneler</h2>
        {staff && !yeni && <Link href="?yeni=1" className="btn"><Plus className="size-4" />Yeni Muayene</Link>}
      </div>
      {staff && yeni && (
        <Card title="Yeni Muayene Aç">
          <form action={createEncounter} className="space-y-3"><input type="hidden" name="patient_id" value={id} />
            {hasOpen && <Alert tone="warn"><AlertTriangle className="size-4 mt-0.5 shrink-0" />Bu hastanın açık bir muayenesi var. Yine de yeni muayene açabilirsiniz.</Alert>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tarih"><input name="opened_at" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
              <Field label="Hekim"><select name="doctor_id" className="input" defaultValue={p.doctor_id ?? ""}><option value="">Seçiniz</option>{doctors?.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}</select></Field>
            </div>
            <Field label="Başvuru nedeni / şikayet"><textarea name="complaint" rows={2} className="input" /></Field>
            <div className="flex gap-2"><Link href={`/hastalar/${id}`} className="btn-secondary">Vazgeç</Link><button className="btn flex-1">Muayeneyi Aç</button></div>
          </form>
        </Card>)}
      {!encs?.length ? <Card><Empty icon={FolderOpen} title="Henüz muayene yok" hint="Muayene açıp hizmet ve seansları ona bağlayın." action={staff && <Link href="?yeni=1" className="btn"><Plus className="size-4" />Yeni Muayene</Link>} /></Card> : (
        <Card flush>
          <div className="divide-rows">{encs.map((e: any) => {
            const sessions = e.sales.flatMap((s: any) => s.sessions); const done = sessions.filter((x: any) => x.status === "tamamlandi").length;
            return (
              <Link key={e.id} href={`/muayene/${e.id}`} className="row">
                <span className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${e.status === "acik" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}><FolderOpen className="size-5" /></span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2"><span className="num">{d(e.opened_at)}</span><span className={`badge ${e.status === "acik" ? "badge-green" : "badge-slate"}`}>{e.status === "acik" ? "Açık" : "Kapalı"}</span></div>
                  <div className="text-[13px] text-slate-500 truncate">{e.sales.length ? e.sales.map((s: any) => `${s.services.name} ×${s.session_count}`).join(", ") : "Hizmet eklenmedi"}{e.complaint && ` · ${e.complaint}`}</div>
                </div>
                {sessions.length > 0 && <span className="text-sm text-slate-500 num">{done}/{sessions.length}</span>}
              </Link>);
          })}</div>
        </Card>)}

      <Card title="Anamnez" action={staff && <Link href={`/hastalar/${id}/anamnez`} className="btn-ghost btn-sm">{an ? <><Pencil className="size-4" />Güncelle</> : <><Plus className="size-4" />Anamnez Al</>}</Link>}>
        {!an ? <Alert tone="warn"><ClipboardList className="size-4 mt-0.5 shrink-0" />Henüz anamnez alınmamış.</Alert> : (
          <div className="space-y-3">
            {an.allergies && <Alert tone="danger"><AlertTriangle className="size-4 mt-0.5 shrink-0" /><span><b>Alerji:</b> {an.allergies}</span></Alert>}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[["Boy / Kilo", `${an.height_cm ?? "—"} cm / ${an.weight_kg ?? "—"} kg`], ["Kronik hastalıklar", an.chronic_diseases], ["Kullandığı ilaçlar", an.medications], ["Ameliyatlar", an.surgeries], ["Klinik öykü", an.clinical_history], ["Özel durumlar", an.special_conditions], ["Alışkanlıklar", [an.smoking && "Sigara", an.alcohol && "Alkol", an.pregnancy && "Gebelik"].filter(Boolean).join(", ")]].map(([k, v]) => (
                <div key={k as string}><dt className="text-xs font-medium text-slate-500">{k}</dt><dd className="mt-0.5">{v || "—"}</dd></div>))}
            </dl>
            <p className="text-xs text-slate-400">Son güncelleme: {dt(an.updated_at)}</p>
          </div>)}
      </Card>
    </div>
  );
}
