import { redirect } from "next/navigation";
import { Plus, Trash2, Stethoscope, Briefcase, Users, Package, Info } from "lucide-react";
import { createClient, getProfile } from "@/lib/supabase/server";
import { ROLE } from "@/lib/format";
import { saveService, saveKitItem, deleteKitItem, saveDoctor, updateProfileRole } from "@/lib/actions";
import { PageHeader, Card, Alert, Avatar } from "@/components/ui";

export default async function Settings() {
  const me = await getProfile(); if (me?.role === "hekim") redirect("/");
  const sb = await createClient();
  const [{ data: services }, { data: products }, { data: doctors }, { data: profiles }] = await Promise.all([
    sb.from("services").select("*, service_kits(product_id, quantity, products(name))").order("name"),
    sb.from("products").select("id, name").eq("is_active", true).order("name"),
    sb.from("doctors").select("*").order("full_name"),
    sb.from("profiles").select("*").order("full_name"),
  ]);
  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title="Ayarlar" subtitle="Hizmetler, paket düşümler, hekimler ve kullanıcılar" />

      <Card title={<span className="flex items-center gap-2"><Briefcase className="size-4 text-brand-600" />Hizmetler & Paket Düşümler</span>}>
        <div className="space-y-3">
          {services?.map((s: any) => (
            <div key={s.id} className="rounded-xl border border-slate-200 p-3 sm:p-4 space-y-3">
              <form action={saveService} className="grid grid-cols-[1fr_7rem_auto] gap-2"><input type="hidden" name="id" value={s.id} />
                <input name="name" className="input" defaultValue={s.name} aria-label="Hizmet adı" /><input name="default_price" type="number" inputMode="decimal" className="input" defaultValue={s.default_price} aria-label="Varsayılan fiyat" /><button className="btn-secondary">Kaydet</button></form>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1"><Package className="size-3.5" />Paket düşüm (seansta tek tıkla düşer)</div>
                {!!s.service_kits.length && <ul className="flex flex-wrap gap-1.5 mb-2">{s.service_kits.map((k: any) => <li key={k.product_id} className="badge badge-slate pl-2.5 pr-1">{k.quantity} × {k.products.name}<form action={deleteKitItem.bind(null, s.id, k.product_id)}><button aria-label="Kaldır" className="size-6 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-600"><Trash2 className="size-3" /></button></form></li>)}</ul>}
                <form action={saveKitItem} className="grid grid-cols-[1fr_4rem_auto] gap-2"><input type="hidden" name="service_id" value={s.id} />
                  <select name="product_id" className="input h-10" required aria-label="Ürün"><option value="">Ürün ekle…</option>{products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <input name="quantity" type="number" min={1} inputMode="numeric" defaultValue={1} className="input h-10 px-2" aria-label="Adet" /><button className="btn-secondary h-10 px-3" aria-label="Ekle"><Plus className="size-4" /></button></form>
              </div>
            </div>))}
          <form action={saveService} className="grid grid-cols-[1fr_7rem_auto] gap-2 pt-2 border-t border-slate-100"><input name="name" className="input" placeholder="Yeni hizmet adı" required aria-label="Yeni hizmet adı" /><input name="default_price" type="number" inputMode="decimal" className="input" placeholder="₺" aria-label="Varsayılan fiyat" /><button className="btn"><Plus className="size-4" />Ekle</button></form>
        </div>
      </Card>

      <Card title={<span className="flex items-center gap-2"><Stethoscope className="size-4 text-brand-600" />Hekimler</span>}>
        <div className="space-y-2">
          {doctors?.map((d: any) => <form key={d.id} action={saveDoctor} className="grid grid-cols-2 sm:grid-cols-[1fr_8rem_9rem_11rem_auto] gap-2"><input type="hidden" name="id" value={d.id} />
            <input name="full_name" className="input" defaultValue={d.full_name} aria-label="Ad soyad" /><input name="specialty" className="input" defaultValue={d.specialty ?? ""} placeholder="Branş" aria-label="Branş" /><input name="phone" type="tel" className="input" defaultValue={d.phone ?? ""} placeholder="Telefon" aria-label="Telefon" />
            <select name="profile_id" className="input" defaultValue={d.profile_id ?? ""} aria-label="Giriş hesabı"><option value="">Giriş hesabı yok</option>{profiles?.filter(p => p.role === "hekim").map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select><button className="btn-secondary">Kaydet</button></form>)}
          <form action={saveDoctor} className="grid grid-cols-2 sm:grid-cols-[1fr_8rem_9rem_auto] gap-2 pt-2 border-t border-slate-100"><input name="full_name" className="input" placeholder="Yeni hekim adı" required aria-label="Yeni hekim adı" /><input name="specialty" className="input" placeholder="Branş" aria-label="Branş" /><input name="phone" type="tel" className="input" placeholder="Telefon" aria-label="Telefon" /><button className="btn"><Plus className="size-4" />Ekle</button></form>
        </div>
      </Card>

      {me?.role === "admin" && <Card title={<span className="flex items-center gap-2"><Users className="size-4 text-brand-600" />Kullanıcılar</span>}>
        <div className="space-y-3">
          <Alert tone="info"><Info className="size-4 mt-0.5 shrink-0" /><span>Yeni kullanıcı eklemek için Supabase paneli → Authentication → Users → <b>Add user</b>. Hesap açıldıktan sonra rolünü buradan seçin.</span></Alert>
          {profiles?.map(p => <form key={p.id} action={updateProfileRole} className="flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={p.id} />
            <Avatar name={p.full_name} size="sm" /><input name="full_name" className="input flex-1 min-w-40" defaultValue={p.full_name} aria-label="Ad soyad" />
            <select name="role" className="input w-36" defaultValue={p.role} aria-label="Rol">{Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <label className="flex items-center gap-2 text-sm min-h-11 px-1"><input type="checkbox" name="is_active" defaultChecked={p.is_active} className="size-4 accent-brand-600" />Aktif</label><button className="btn-secondary">Kaydet</button></form>)}
        </div>
      </Card>}
    </div>
  );
}
