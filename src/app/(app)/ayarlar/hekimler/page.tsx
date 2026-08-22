import { Plus, Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveDoctor } from "@/lib/actions";
import { PageHeader, Card, Field, Avatar } from "@/components/ui";

export default async function Doctors() {
  const sb = await createClient();
  const [{ data: doctors }, { data: profiles }] = await Promise.all([
    sb.from("doctors").select("*, patients(count)").order("full_name"),
    sb.from("profiles").select("id, full_name").eq("role", "hekim"),
  ]);
  const Row = ({ d }: { d?: any }) => (
    <form action={saveDoctor} className="grid grid-cols-2 sm:grid-cols-[1fr_9rem_10rem_12rem_auto] gap-2 items-end">
      {d && <input type="hidden" name="id" value={d.id} />}
      <Field label="Ad soyad" required className="col-span-2 sm:col-span-1"><input name="full_name" className="input" defaultValue={d?.full_name} required placeholder="Dr. Ad Soyad" /></Field>
      <Field label="Branş"><input name="specialty" className="input" defaultValue={d?.specialty ?? ""} /></Field>
      <Field label="Telefon"><input name="phone" type="tel" className="input" defaultValue={d?.phone ?? ""} /></Field>
      <Field label="Giriş hesabı" className="col-span-2 sm:col-span-1"><select name="profile_id" className="input" defaultValue={d?.profile_id ?? ""}><option value="">Yok</option>{profiles?.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></Field>
      <button className={`${d ? "btn-secondary" : "btn"} col-span-2 sm:col-span-1`}>{d ? "Kaydet" : <><Plus className="size-4" />Ekle</>}</button>
    </form>
  );
  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader title="Hekimler" subtitle="Hasta yönlendiren hekimler. Giriş hesabı bağlanan hekim kendi hastalarını görebilir." />
      <Card title="Yeni Hekim"><Row /></Card>
      {doctors?.map((d: any) => <Card key={d.id} title={<span className="flex items-center gap-2"><Avatar name={d.full_name} size="sm" />{d.full_name}<span className="badge badge-slate">{d.patients[0]?.count ?? 0} hasta</span></span>}><Row d={d} /></Card>)}
      {!doctors?.length && <p className="text-sm text-slate-500 flex items-center gap-2"><Stethoscope className="size-4" />Henüz hekim eklenmedi.</p>}
    </div>
  );
}
