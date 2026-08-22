import { Plus, Package, SlidersHorizontal, PackagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CAT } from "@/lib/format";
import { addStockMove, saveProduct } from "@/lib/actions";
import { PageHeader, Card, Field, Empty } from "@/components/ui";

export default async function Products() {
  const sb = await createClient();
  const { data: products } = await sb.from("product_stock").select("*").order("category").order("name");
  const lowCount = (products ?? []).filter(p => p.is_active && p.stock <= p.min_stock).length;
  const groups = ["serum", "ilac", "sarf"].map(c => ({ c, items: (products ?? []).filter(p => p.category === c) })).filter(g => g.items.length);
  return (
    <div className="space-y-5">
      <PageHeader title="Ürünler" subtitle={lowCount ? `${lowCount} ürün kritik seviyede` : "Tüm ürünler yeterli seviyede"} />
      <div className="grid lg:grid-cols-[1fr_22rem] gap-5 items-start">
        <Card flush>
          {!products?.length ? <Empty icon={Package} title="Ürün yok" hint="Sağdaki formdan ürün ekleyin." /> : (
            <div className="overflow-x-auto"><table className="tbl">
              <thead><tr><th>Ürün</th><th className="text-right">Stok</th><th className="text-right">Kritik</th></tr></thead>
              <tbody>{groups.map(g => (<>
                <tr key={g.c}><td colSpan={3} className="bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-500 py-2">{CAT[g.c]}</td></tr>
                {g.items.map(p => <tr key={p.id} className={!p.is_active ? "opacity-50" : ""}><td className="font-medium">{p.name}</td><td className="text-right"><span className={`font-bold num ${p.stock <= p.min_stock ? "text-red-600" : ""}`}>{p.stock}</span></td><td className="text-right text-slate-500 num">{p.min_stock}</td></tr>)}
              </>))}</tbody></table></div>)}
        </Card>
        <div className="space-y-5">
          <Card title={<span className="flex items-center gap-2"><PackagePlus className="size-4 text-brand-600" />Yeni Ürün</span>}>
            <form action={saveProduct} className="space-y-3">
              <Field label="Ürün adı" required><input name="name" className="input" required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kategori"><select name="category" className="input"><option value="serum">Serum</option><option value="ilac">İlaç</option><option value="sarf">Sarf</option></select></Field>
                <Field label="Kritik stok"><input name="min_stock" type="number" inputMode="numeric" className="input" defaultValue={5} /></Field>
              </div>
              <button className="btn w-full"><Plus className="size-4" />Ürün Ekle</button>
            </form>
          </Card>
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
        </div>
      </div>
    </div>
  );
}
