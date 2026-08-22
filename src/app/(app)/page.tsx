import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import { tl, STATUS } from "@/lib/format";
export default async function Home() {
  const sb = await createClient(); const p = await getProfile();
  const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1);
  const { data: today } = await sb.from("sessions").select("id, seq, scheduled_at, status, patients(first_name,last_name,address), sales(session_count, services(name))")
    .gte("scheduled_at", start.toISOString()).lt("scheduled_at", end.toISOString()).order("scheduled_at");
  const { data: unplanned } = await sb.from("sessions").select("id, seq, patients(first_name,last_name), sales(session_count, services(name))").is("scheduled_at", null).eq("status", "planlandi").limit(20);
  const { data: balances } = p?.role === "hekim" ? { data: [] } : await sb.from("sale_balances").select("id, balance, patients(first_name,last_name), services(name)").gt("balance", 0).order("created_at", { ascending: false });
  const { data: low } = p?.role === "hekim" ? { data: [] } : await sb.from("product_stock").select("id,name,stock,min_stock").eq("is_active", true);
  const lows = (low ?? []).filter(x => x.stock <= x.min_stock);
  const totalBal = (balances ?? []).reduce((a, b) => a + Number(b.balance), 0);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Merhaba, {p?.full_name?.split(" ")[0]}</h1>
      <section className="card">
        <h2 className="font-medium mb-2">Bugünkü Seanslar ({today?.length ?? 0})</h2>
        {!today?.length && <p className="text-sm text-slate-500">Bugün planlı seans yok.</p>}
        <ul className="divide-y">{today?.map((x: any) => (
          <li key={x.id}><Link href={`/seans/${x.id}`} className="flex items-center gap-3 py-3">
            <span className="font-mono text-sm w-12">{new Date(x.scheduled_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
            <div className="flex-1"><div className="font-medium">{x.patients.first_name} {x.patients.last_name}</div><div className="text-xs text-slate-500">{x.sales.services.name} · {x.seq}/{x.sales.session_count} {x.patients.address && `· ${x.patients.address}`}</div></div>
            <span className={`badge ${x.status === "tamamlandi" ? "bg-green-100 text-green-700" : x.status === "iptal" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{STATUS[x.status]}</span>
          </Link></li>))}</ul>
      </section>
      {!!unplanned?.length && <section className="card"><h2 className="font-medium mb-2">Planlanmamış Seanslar ({unplanned.length})</h2>
        <ul className="divide-y">{unplanned.map((x: any) => <li key={x.id}><Link href={`/seans/${x.id}`} className="block py-2 text-sm">{x.patients.first_name} {x.patients.last_name} — {x.sales.services.name} {x.seq}/{x.sales.session_count}</Link></li>)}</ul></section>}
      {p?.role !== "hekim" && <div className="grid md:grid-cols-2 gap-4">
        <section className="card"><h2 className="font-medium mb-2">Açık Bakiyeler <span className="text-red-600">{tl(totalBal)}</span></h2>
          <ul className="divide-y text-sm">{balances?.slice(0, 10).map((b: any) => <li key={b.id} className="flex justify-between py-2"><span>{b.patients.first_name} {b.patients.last_name} <span className="text-slate-500">· {b.services.name}</span></span><b>{tl(b.balance)}</b></li>)}</ul></section>
        <section className="card"><h2 className="font-medium mb-2">Kritik Stok ({lows.length})</h2>
          {!lows.length ? <p className="text-sm text-slate-500">Kritik stok yok.</p> : <ul className="divide-y text-sm">{lows.map(x => <li key={x.id} className="flex justify-between py-2"><span>{x.name}</span><b className="text-red-600">{x.stock} adet</b></li>)}</ul>}</section>
      </div>}
    </div>
  );
}
