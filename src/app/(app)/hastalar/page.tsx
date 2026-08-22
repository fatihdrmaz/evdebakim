import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
export default async function Patients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams; const sb = await createClient();
  let qry = sb.from("patients").select("id, first_name, last_name, phone, doctors(full_name)").order("created_at", { ascending: false }).limit(100);
  if (q) qry = qry.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data } = await qry;
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center"><h1 className="text-xl font-semibold flex-1">Hastalar</h1><Link href="/hastalar/yeni" className="btn">+ Yeni Hasta</Link></div>
      <form><input name="q" defaultValue={q} placeholder="Ad, soyad veya telefon ara…" className="input" /></form>
      <ul className="card divide-y p-0">{data?.map((p: any) => (
        <li key={p.id}><Link href={`/hastalar/${p.id}`} className="flex justify-between items-center px-4 py-3">
          <div><div className="font-medium">{p.first_name} {p.last_name}</div><div className="text-xs text-slate-500">{p.phone}{p.doctors && ` · Dr. ${p.doctors.full_name}`}</div></div><span className="text-slate-400">›</span>
        </Link></li>))}
        {!data?.length && <li className="p-4 text-sm text-slate-500">Hasta bulunamadı.</li>}
      </ul>
    </div>
  );
}
