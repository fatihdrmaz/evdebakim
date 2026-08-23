import { Plus, Trash2, Package, PackagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveMaterialKit, deleteMaterialKit, addMaterialKitItem, deleteMaterialKitItem } from "@/lib/actions";
import { PageHeader, Card, Field, Empty } from "@/components/ui";

export default async function MaterialKits() {
  const sb = await createClient();
  const [{ data: kits }, { data: products }] = await Promise.all([
    sb.from("material_kits").select("*, material_kit_items(product_id, quantity, products(name))").order("name"),
    sb.from("products").select("id, name").eq("is_active", true).order("name"),
  ]);
  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader title="Malzeme Paketleri" subtitle="Hizmetten bağımsız, seansta tek tıkla stoktan düşülen ürün grupları." />
      <Card title={<span className="flex items-center gap-2"><PackagePlus className="size-4 text-brand-600" />Yeni Paket</span>}>
        <form action={saveMaterialKit} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <Field label="Paket adı" required><input name="name" className="input" required placeholder="Örn. İzo 500" /></Field>
          <button className="btn"><Plus className="size-4" />Paket Oluştur</button>
        </form>
      </Card>
      {!kits?.length ? <Card><Empty icon={Package} title="Henüz paket yok" hint="Yukarıdan ilk paketi oluşturun." /></Card> : kits.map((k: any) => (
        <Card key={k.id} title={k.name} action={<form action={deleteMaterialKit.bind(null, k.id)}><button className="btn-ghost btn-sm text-red-600"><Trash2 className="size-4" />Paketi Sil</button></form>}>
          <div className="space-y-4">
            {k.material_kit_items.length ? <ul className="flex flex-wrap gap-1.5">{k.material_kit_items.map((it: any) => (
              <li key={it.product_id} className="badge badge-slate pl-2.5 pr-1 h-8">{it.quantity} × {it.products.name}
                <form action={deleteMaterialKitItem.bind(null, k.id, it.product_id)}><button aria-label="Kaldır" className="size-6 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-600"><Trash2 className="size-3" /></button></form>
              </li>))}</ul>
              : <p className="text-sm text-slate-500">Ürün eklenmedi.</p>}
            <form action={addMaterialKitItem} className="grid grid-cols-[1fr_5rem_auto] gap-2 items-end"><input type="hidden" name="kit_id" value={k.id} />
              <Field label="Ürün"><select name="product_id" className="input" required><option value="">Seçiniz</option>{products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
              <Field label="Adet"><input name="quantity" type="number" min={1} inputMode="numeric" defaultValue={1} className="input px-2" /></Field>
              <button className="btn-secondary" aria-label="Pakete ekle"><Plus className="size-4" /></button>
            </form>
          </div>
        </Card>))}
    </div>
  );
}
