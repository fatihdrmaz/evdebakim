import Link from "next/link";
import { Plus, Search, Users, Phone, Navigation, FileText, ChevronRight } from "lucide-react";
import { createClient, getProfile } from "@/lib/supabase/server";
import { PageHeader, Card, Avatar, Empty } from "@/components/ui";

export default async function Patients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams; const sb = await createClient(); const me = await getProfile();
  let qry = sb.from("patients").select("id, first_name, last_name, phone, address, doctors(full_name)").order("created_at", { ascending: false }).limit(100);
  if (q) qry = qry.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data } = await qry;
  const patientIds = (data ?? []).map((p: any) => p.id);
  const { data: rxRows } = patientIds.length
    ? await sb.from("prescriptions").select("file_path, encounters!inner(patient_id)").in("encounters.patient_id", patientIds).order("created_at", { ascending: false })
    : { data: [] as any[] };
  const latestRxPath: Record<string, string> = {};
  for (const r of rxRows ?? []) { const pid = (r as any).encounters.patient_id; if (!(pid in latestRxPath)) latestRxPath[pid] = (r as any).file_path; }
  const rxUrls = Object.fromEntries(await Promise.all(Object.entries(latestRxPath).map(async ([pid, path]) => [pid, (await sb.storage.from("prescriptions").createSignedUrl(path, 3600)).data?.signedUrl])));
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
            <div key={p.id} className="row px-2 sm:px-3">
              <Link href={`/hastalar/${p.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar name={`${p.first_name} ${p.last_name}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{p.first_name} {p.last_name}</div>
                  <div className="text-[13px] text-slate-500 truncate">{p.phone}{p.doctors && <span className="text-slate-400"> · {(p.doctors as any).full_name}</span>}</div>
                </div>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                {p.phone && <a href={`tel:${p.phone}`} aria-label="Ara" className="btn-icon"><Phone className="size-4" /></a>}
                {p.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer" aria-label="Yol tarifi" className="btn-icon"><Navigation className="size-4" /></a>}
                {rxUrls[p.id] && <a href={rxUrls[p.id]} target="_blank" rel="noopener noreferrer" aria-label="Reçete" className="btn-icon"><FileText className="size-4" /></a>}
                <Link href={`/hastalar/${p.id}`} aria-hidden className="btn-icon text-slate-300"><ChevronRight className="size-4" /></Link>
              </div>
            </div>))}</div>)}
      </Card>
    </div>
  );
}
