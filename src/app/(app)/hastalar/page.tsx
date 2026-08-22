import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { createClient, getProfile } from "@/lib/supabase/server";
import { PageHeader, Card, Avatar, Empty, ListRow } from "@/components/ui";

export default async function Patients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams; const sb = await createClient(); const me = await getProfile();
  let qry = sb.from("patients").select("id, first_name, last_name, phone, doctors(full_name)").order("created_at", { ascending: false }).limit(100);
  if (q) qry = qry.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data } = await qry;
  return (
    <div>
      <PageHeader title="Hastalar" subtitle={`${data?.length ?? 0} kayıt`} action={me?.role !== "hekim" && <Link href="/hastalar/yeni" className="btn"><Plus className="size-4" /><span className="hidden sm:inline">Yeni Hasta</span><span className="sm:hidden">Yeni</span></Link>} />
      <form className="relative mb-4" role="search">
        <Search className="size-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input name="q" defaultValue={q} placeholder="Ad, soyad veya telefon ara…" className="input pl-11" aria-label="Hasta ara" />
      </form>
      <Card flush>
        {!data?.length ? <Empty icon={Users} title={q ? "Sonuç bulunamadı" : "Henüz hasta yok"} hint={q ? "Farklı bir arama deneyin." : "İlk hastanızı ekleyerek başlayın."} action={!q && <Link href="/hastalar/yeni" className="btn"><Plus className="size-4" />Yeni Hasta</Link>} /> : (
          <div className="divide-rows">{data.map((p: any) => (
            <ListRow key={p.id} href={`/hastalar/${p.id}`} left={<Avatar name={`${p.first_name} ${p.last_name}`} />} title={`${p.first_name} ${p.last_name}`} subtitle={<>{p.phone}{p.doctors && <span className="text-slate-400"> · {p.doctors.full_name}</span>}</>} />))}</div>)}
      </Card>
    </div>
  );
}
