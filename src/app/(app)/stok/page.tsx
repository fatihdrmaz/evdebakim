import Link from "next/link";
import { Plus, Package, SlidersHorizontal, PackagePlus, History, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CAT, d } from "@/lib/format";
import { addStockMove, saveProduct } from "@/lib/actions";
import { PageHeader, Card, Field, Empty } from "@/components/ui";

export default async function Stock() {
  const sb = await createClient();
  const [{ data: products }, { data: purchases }, { data: moves }] = await Promise.all([
    sb.from("product_stock").select("*").order("category").order("name"),
    sb.from("purchases").select("id, supplier, invoice_no, invoice_date, total, purchase_items(count)").order("invoice_date", { ascending: false }).limit(10),
    sb.from("stock_moves").select("id, quantity, type, created_at, notes, products(name), sessions(patients(first_name,last_name))").order("created_at", { ascending: false }).limit(30),
  ]);
  const TYPE: Record<string, string> = { alis: "Alış", seans_dusum: "Seans", manuel_dusum: "Düşüm", duzeltme: "Düzeltme" };
  const lowCount = (products ?? []).filter(p => p.is_active && p.stock <= p.min_stock).length;
  return (
    <div className="space-y-5">
      <PageHeader title="Stok" subtitle={lowCount ? `${lowCount} ürün kritik seviyede` : "Tüm ürünler yeterli seviyede"} action={<Link href="/stok/alis" className="btn"><Plus className="size-4" /><span className="hidden sm:inline">Alış Faturası</span><span className="sm:hidden">Alış</span></Link>} />

      <Card title="Ürünler" flush>
        {!products?.length ? <Empty icon={Package} title="Ürün yok" /> : (
          <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>Ürün</th><th>Kategori</th><th className="text-right">Stok</th></tr></thead>
            <tbody>{products.map(p => <tr key={p.id} className={!p.is_active ? "opacity-50" : ""}><td className="font-medium">{p.name}</td><td><span className="badge badge-slate">{CAT[p.category]}</span></td>
              <td className="text-right"><span className={`font-bold num ${p.stock <= p.min_stock ? "text-red-600" : "text-slate-900"}`}>{p.stock}</span><span className="text-xs text-slate-400 ml-1">/ min {p.min_stock}</span></td></tr>)}</tbody></table></div>)}
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title={<span className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-brand-600" />Manuel Düşüm / Düzeltme</span>}>
          <form action={addStockMove} className="space-y-3">
            <Field label="Ürün" required><select name="product_id" className="input" required><option value="">Seçiniz</option>{products?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="İşlem"><select name="type" className="input"><option value="manuel_dusum">Düşüm (fire, zayi)</option><option value="duzeltme">Düzeltme (+/−)</option></select></Field>
              <Field label="Adet" required><input name="quantity" type="number" inputMode="numeric" className="input" required /></Field>
            </div>
            <Field label="Açıklama"><input name="notes" className="input" /></Field>
            <button className="btn-secondary w-full">Kaydet</button>
          </form>
        </Card>
        <Card title={<span className="flex items-center gap-2"><PackagePlus className="size-4 text-brand-600" />Yeni Ürün</span>}>
          <form action={saveProduct} className="space-y-3">
            <Field label="Ürün adı" required><input name="name" className="input" required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kategori"><select name="category" className="input"><option value="serum">Serum</option><option value="ilac">İlaç</option><option value="sarf">Sarf</option></select></Field>
              <Field label="Kritik stok"><input name="min_stock" type="number" inputMode="numeric" className="input" defaultValue={5} /></Field>
            </div>
            <button className="btn-secondary w-full"><Plus className="size-4" />Ürün Ekle</button>
          </form>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title={<span className="flex items-center gap-2"><FileText className="size-4 text-brand-600" />Son Alışlar</span>} flush>
          {!purchases?.length ? <Empty icon={FileText} title="Alış kaydı yok" /> : <ul className="divide-rows">{purchases.map((p: any) => <li key={p.id} className="flex items-center justify-between px-4 sm:px-5 py-3 text-sm"><div><div className="font-medium">{p.supplier ?? "Tedarikçi belirtilmedi"}</div><div className="text-xs text-slate-500">{d(p.invoice_date)}{p.invoice_no && ` · ${p.invoice_no}`}</div></div><span className="badge badge-slate">{p.purchase_items[0]?.count} kalem</span></li>)}</ul>}
        </Card>
        <Card title={<span className="flex items-center gap-2"><History className="size-4 text-brand-600" />Son Hareketler</span>} flush>
          {!moves?.length ? <Empty icon={History} title="Hareket yok" /> : <ul className="divide-rows">{moves.map((m: any) => <li key={m.id} className="flex items-center justify-between px-4 sm:px-5 py-2.5 text-sm"><div className="min-w-0"><div className="font-medium truncate">{m.products.name}</div><div className="text-xs text-slate-500 truncate">{TYPE[m.type]}{m.sessions?.patients && ` · ${m.sessions.patients.first_name} ${m.sessions.patients.last_name}`}{m.notes && ` · ${m.notes}`}</div></div><b className={`num ${m.quantity < 0 ? "text-red-600" : "text-emerald-700"}`}>{m.quantity > 0 ? "+" : ""}{m.quantity}</b></li>)}</ul>}
        </Card>
      </div>
    </div>
  );
}
