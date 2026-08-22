import Link from "next/link";
import { History, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { dt } from "@/lib/format";
import { PageHeader, Card, Empty } from "@/components/ui";

const TYPE: Record<string, string> = { alis: "Alış", seans_dusum: "Seans düşümü", manuel_dusum: "Manuel düşüm", duzeltme: "Düzeltme" };

export default async function Moves({ searchParams }: { searchParams: Promise<{ tip?: string; q?: string; urun?: string }> }) {
  const { tip, q, urun } = await searchParams; const sb = await createClient();
  let qry = sb.from("stock_moves").select("id, quantity, type, created_at, notes, products(id, name), sessions(id, seq, patient_id, patients(first_name,last_name)), purchase_items(purchase_id, purchases(supplier, invoice_no))").order("created_at", { ascending: false }).limit(200);
  if (tip) qry = qry.eq("type", tip);
  if (urun) qry = qry.eq("product_id", urun);
  const [{ data }, { data: products }] = await Promise.all([qry, sb.from("products").select("id, name").order("name")]);
  const rows = (data ?? []).filter((m: any) => !q || `${m.sessions?.patients?.first_name ?? ""} ${m.sessions?.patients?.last_name ?? ""} ${m.products.name}`.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr")));
  return (
    <div>
      <PageHeader title="Stok Hareketleri" subtitle="Alışlar, hasta bazlı seans düşümleri ve düzeltmeler" />
      <form className="grid grid-cols-1 sm:grid-cols-[1fr_11rem_12rem_auto] gap-2 mb-4">
        <div className="relative"><Search className="size-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" /><input name="q" defaultValue={q} placeholder="Hasta veya ürün ara…" className="input pl-11" aria-label="Ara" /></div>
        <select name="tip" className="input" defaultValue={tip ?? ""} aria-label="Hareket tipi"><option value="">Tüm hareketler</option>{Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select name="urun" className="input" defaultValue={urun ?? ""} aria-label="Ürün"><option value="">Tüm ürünler</option>{products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button className="btn-secondary">Filtrele</button>
      </form>
      <Card flush>
        {!rows.length ? <Empty icon={History} title="Hareket bulunamadı" /> : (
          <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>Tarih</th><th>Ürün</th><th>İşlem</th><th>Hasta / Kaynak</th><th className="text-right">Adet</th></tr></thead>
            <tbody>{rows.map((m: any) => (
              <tr key={m.id}>
                <td className="num text-slate-500 whitespace-nowrap">{dt(m.created_at)}</td>
                <td className="font-medium">{m.products.name}</td>
                <td><span className={`badge ${m.type === "alis" ? "badge-green" : m.type === "seans_dusum" ? "badge-blue" : "badge-slate"}`}>{TYPE[m.type]}</span></td>
                <td>{m.sessions?.patients ? <Link href={`/seans/${m.sessions.id}`} className="text-brand-700 hover:underline">{m.sessions.patients.first_name} {m.sessions.patients.last_name} <span className="text-slate-400">· Seans {m.sessions.seq}</span></Link>
                  : m.purchase_items?.purchases ? <Link href={`/stok/faturalar/${m.purchase_items.purchase_id}`} className="text-brand-700 hover:underline">{m.purchase_items.purchases.supplier ?? "Fatura"}{m.purchase_items.purchases.invoice_no && ` · ${m.purchase_items.purchases.invoice_no}`}</Link>
                  : <span className="text-slate-500">{m.notes ?? "—"}</span>}</td>
                <td className={`text-right font-bold num ${m.quantity < 0 ? "text-red-600" : "text-emerald-700"}`}>{m.quantity > 0 ? "+" : ""}{m.quantity}</td>
              </tr>))}</tbody></table></div>)}
      </Card>
    </div>
  );
}
