import { Plus, Trash2, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveService, saveKitItem, deleteKitItem } from "@/lib/actions";
import { PageHeader, Card, Field } from "@/components/ui";

export default async function Services() {
  const sb = await createClient();
  const [{ data: services }, { data: products }] = await Promise.all([
    sb.from("services").select("*, service_kits(product_id, quantity, products(name))").order("name"),
    sb.from("products").select("id, name").eq("is_active", true).order("name"),
  ]);
  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader title="Hizmetler & Paket Düşümler" subtitle="Varsayılan fiyat satışta değiştirilebilir. Paket düşüm, seansta tek tıkla stoktan düşer." />
      <Card title="Yeni Hizmet">
        <form action={saveService} className="grid grid-cols-1 sm:grid-cols-[1fr_10rem_auto] gap-3 items-end">
          <Field label="Hizmet adı" required><input name="name" className="input" required placeholder="Örn. Serum Tedavisi" /></Field>
          <Field label="Varsayılan fiyat (₺)"><input name="default_price" type="number" inputMode="decimal" className="input" /></Field>
          <button className="btn"><Plus className="size-4" />Ekle</button>
        </form>
      </Card>
      {services?.map((s: any) => (
        <Card key={s.id} title={s.name}>
          <div className="space-y-4">
            <form action={saveService} className="grid grid-cols-1 sm:grid-cols-[1fr_10rem_auto] gap-3 items-end"><input type="hidden" name="id" value={s.id} />
              <Field label="Hizmet adı"><input name="name" className="input" defaultValue={s.name} /></Field>
              <Field label="Varsayılan fiyat (₺)"><input name="default_price" type="number" inputMode="decimal" className="input" defaultValue={s.default_price} /></Field>
              <button className="btn-secondary">Kaydet</button></form>
            <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Package className="size-4 text-brand-600" />Paket düşüm</div>
              {s.service_kits.length ? <ul className="flex flex-wrap gap-1.5 mb-3">{s.service_kits.map((k: any) => <li key={k.product_id} className="badge badge-slate pl-2.5 pr-1 h-8">{k.quantity} × {k.products.name}<form action={deleteKitItem.bind(null, s.id, k.product_id)}><button aria-label="Kaldır" className="size-6 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-600"><Trash2 className="size-3" /></button></form></li>)}</ul>
                : <p className="text-sm text-slate-500 mb-3">Tanımlı paket yok.</p>}
              <form action={saveKitItem} className="grid grid-cols-[1fr_5rem_auto] gap-2 items-end"><input type="hidden" name="service_id" value={s.id} />
                <Field label="Ürün"><select name="product_id" className="input" required><option value="">Seçiniz</option>{products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
                <Field label="Adet"><input name="quantity" type="number" min={1} inputMode="numeric" defaultValue={1} className="input px-2" /></Field>
                <button className="btn-secondary" aria-label="Pakete ekle"><Plus className="size-4" /></button></form>
            </div>
          </div>
        </Card>))}
    </div>
  );
}
