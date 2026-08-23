import { Plus, Package, SlidersHorizontal, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CAT } from "@/lib/format";
import { addStockMove, saveProduct, deleteProduct } from "@/lib/actions";
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
            <div>{groups.map(g => (
              <div key={g.c}>
                <div className="bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-500 py-2 px-4 sm:px-5">{CAT[g.c]}</div>
                {g.items.map(p => (
                  <details key={p.id} className={`group border-b border-slate-100 last:border-0 ${!p.is_active ? "opacity-50" : ""}`}>
                    <summary className="flex items-center gap-3 px-4 sm:px-5 py-2.5 cursor-pointer hover:bg-slate-50">
                      <span className="flex-1 font-medium truncate">{p.name}</span>
                      <span className={`font-bold num ${p.stock <= p.min_stock ? "text-red-600" : ""}`}>{p.stock}</span>
                      <span className="text-slate-500 num text-sm w-9 text-right">/{p.min_stock}</span>
                      <Pencil className="size-3.5 text-slate-400 shrink-0" />
                    </summary>
                    <div className="px-4 sm:px-5 pb-4 pt-3 space-y-3 border-t border-slate-100 bg-slate-50/40">
                      <form action={saveProduct} className="grid grid-cols-2 gap-3">
                        <input type="hidden" name="id" value={p.id} />
                        <Field label="Ürün adı" required className="col-span-2"><input name="name" className="input" defaultValue={p.name} required /></Field>
                        <Field label="Kategori"><select name="category" className="input" defaultValue={p.category}><option value="serum">Serum</option><option value="ilac">İlaç</option><option value="sarf">Sarf</option></select></Field>
                        <Field label="Kritik stok"><input name="min_stock" type="number" inputMode="numeric" className="input" defaultValue={p.min_stock} /></Field>
                        <label className="col-span-2 flex items-center gap-2 text-sm cursor-pointer min-h-9"><input type="checkbox" name="is_active" defaultChecked={p.is_active} className="size-4 accent-brand-600" />Aktif</label>
                        <button className="btn-secondary col-span-2">Kaydet</button>
                      </form>
                      <form action={deleteProduct.bind(null, p.id)}><button className="btn-danger w-full"><Trash2 className="size-4" />Ürünü Sil</button></form>
                    </div>
                  </details>
                ))}
              </div>
            ))}</div>)}
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
