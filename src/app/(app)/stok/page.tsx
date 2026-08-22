import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CAT, d } from "@/lib/format";
import { addStockMove, saveProduct } from "@/lib/actions";
export default async function Stock() {
  const sb = await createClient();
  const [{ data: products }, { data: purchases }, { data: moves }] = await Promise.all([
    sb.from("product_stock").select("*").order("category").order("name"),
    sb.from("purchases").select("id, supplier, invoice_no, invoice_date, total, purchase_items(count)").order("invoice_date", { ascending: false }).limit(10),
    sb.from("stock_moves").select("id, quantity, type, created_at, notes, products(name), sessions(patients(first_name,last_name))").order("created_at", { ascending: false }).limit(30),
  ]);
  const TYPE: Record<string, string> = { alis: "Alış", seans_dusum: "Seans", manuel_dusum: "Manuel düşüm", duzeltme: "Düzeltme" };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><h1 className="text-xl font-semibold flex-1">Stok</h1><Link href="/stok/alis" className="btn">+ Alış Faturası</Link></div>
      <section className="card p-0 overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-slate-500"><tr><th className="text-left p-3">Ürün</th><th className="text-left">Kategori</th><th className="text-right p-3">Stok</th></tr></thead>
        <tbody>{products?.map(p => <tr key={p.id} className={`border-t ${!p.is_active ? "opacity-50" : ""}`}><td className="p-3">{p.name}</td><td>{CAT[p.category]}</td><td className={`text-right p-3 font-semibold ${p.stock <= p.min_stock ? "text-red-600" : ""}`}>{p.stock}</td></tr>)}</tbody></table></section>
      <details className="card"><summary className="cursor-pointer font-medium">Manuel düşüm / düzeltme</summary>
        <form action={addStockMove} className="grid grid-cols-2 gap-2 mt-3">
          <select name="product_id" className="input col-span-2" required><option value="">Ürün…</option>{products?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</select>
          <select name="type" className="input"><option value="manuel_dusum">Düşüm (fire, zayi)</option><option value="duzeltme">Düzeltme (+/- sayım)</option></select>
          <input name="quantity" type="number" className="input" placeholder="Adet" required />
          <input name="notes" className="input col-span-2" placeholder="Açıklama" /><button className="btn col-span-2">Kaydet</button></form></details>
      <details className="card"><summary className="cursor-pointer font-medium">Yeni ürün ekle</summary>
        <form action={saveProduct} className="grid grid-cols-2 gap-2 mt-3"><input name="name" className="input col-span-2" placeholder="Ürün adı" required />
          <select name="category" className="input"><option value="serum">Serum</option><option value="ilac">İlaç</option><option value="sarf">Sarf</option></select>
          <input name="min_stock" type="number" className="input" placeholder="Kritik stok" defaultValue={5} /><button className="btn col-span-2">Ekle</button></form></details>
      <section className="card"><h2 className="font-medium mb-2">Son Alışlar</h2><ul className="divide-y text-sm">{purchases?.map((p: any) => <li key={p.id} className="flex justify-between py-2"><span>{d(p.invoice_date)} · {p.supplier ?? "—"} {p.invoice_no && `· ${p.invoice_no}`}</span><span className="text-slate-500">{p.purchase_items[0]?.count} kalem</span></li>)}{!purchases?.length && <li className="py-2 text-slate-500">Alış yok.</li>}</ul></section>
      <section className="card"><h2 className="font-medium mb-2">Son Hareketler</h2><ul className="divide-y text-sm">{moves?.map((m: any) => <li key={m.id} className="flex justify-between py-1.5"><span>{m.products.name} <span className="text-xs text-slate-500">{TYPE[m.type]}{m.sessions?.patients && ` · ${m.sessions.patients.first_name} ${m.sessions.patients.last_name}`}</span></span><b className={m.quantity < 0 ? "text-red-600" : "text-green-700"}>{m.quantity > 0 ? "+" : ""}{m.quantity}</b></li>)}</ul></section>
    </div>
  );
}
