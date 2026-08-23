import Link from "next/link";
import { Search, FolderOpen } from "lucide-react";
import { createClient, getProfile } from "@/lib/supabase/server";
import { tl, d } from "@/lib/format";
import { PageHeader, Card, Empty } from "@/components/ui";

export default async function Encounters({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams; const sb = await createClient(); const me = await getProfile();
  const staff = me?.role !== "hekim";
  let qry = sb.from("encounters").select("id, opened_at, status, patients!inner(first_name,last_name)").order("opened_at", { ascending: false }).limit(100);
  if (q) qry = qry.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`, { foreignTable: "patients" });
  const { data: encs } = await qry;
  const encIds = (encs ?? []).map((e: any) => e.id);
  const { data: sales } = encIds.length
    ? await sb.from("sale_balances").select("encounter_id, services(name), total, paid, balance, session_count, done_sessions").in("encounter_id", encIds)
    : { data: [] as any[] };
  const byEnc: Record<string, { total: number; paid: number; balance: number; sessionCount: number; done: number; services: string[] }> = {};
  for (const s of sales ?? []) {
    const acc = byEnc[s.encounter_id] ?? { total: 0, paid: 0, balance: 0, sessionCount: 0, done: 0, services: [] };
    acc.total += Number(s.total); acc.paid += Number(s.paid); acc.balance += Number(s.balance);
    acc.sessionCount += s.session_count; acc.done += s.done_sessions; acc.services.push((s.services as any).name);
    byEnc[s.encounter_id] = acc;
  }

  return (
    <div>
      <PageHeader title="Muayeneler" subtitle={`${encs?.length ?? 0} kayıt`} />
      <form className="relative mb-4" role="search">
        <Search className="size-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input name="q" defaultValue={q} placeholder="Hasta adı ara…" className="input pl-11" aria-label="Muayene ara" />
      </form>
      <Card flush>
        {!encs?.length ? <Empty icon={FolderOpen} title={q ? "Sonuç bulunamadı" : "Henüz muayene yok"} /> : (
          <div className="divide-rows">{encs.map((e: any) => {
            const agg = byEnc[e.id];
            return (
              <Link key={e.id} href={`/muayene/${e.id}`} className="row">
                <span className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${e.status === "acik" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}><FolderOpen className="size-5" /></span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2"><span className="truncate">{e.patients.first_name} {e.patients.last_name}</span><span className={`badge ${e.status === "acik" ? "badge-green" : "badge-slate"} shrink-0`}>{e.status === "acik" ? "Açık" : "Kapalı"}</span></div>
                  <div className="text-[13px] text-slate-500 truncate">{d(e.opened_at)}{agg?.services.length ? ` · ${agg.services.join(", ")}` : " · Hizmet eklenmedi"}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                  {agg && agg.sessionCount > 0 && <span className="text-xs text-slate-500 num">{agg.done}/{agg.sessionCount} seans</span>}
                  {staff && agg && agg.balance > 0 && <span className="badge badge-red num">{tl(agg.balance)}</span>}
                  {staff && agg && agg.balance === 0 && agg.total > 0 && <span className="badge badge-green">Ödendi</span>}
                </div>
              </Link>);
          })}</div>)}
      </Card>
    </div>
  );
}
