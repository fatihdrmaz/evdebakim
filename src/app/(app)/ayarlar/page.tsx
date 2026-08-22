import { redirect } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import { tl, ROLE } from "@/lib/format";
import { saveService, saveKitItem, deleteKitItem, saveDoctor, updateProfileRole } from "@/lib/actions";
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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Ayarlar</h1>
      <section className="card space-y-3"><h2 className="font-medium">Hizmetler & Paket Düşümler</h2>
        {services?.map((s: any) => <div key={s.id} className="border rounded-lg p-3 space-y-2">
          <form action={saveService} className="flex gap-2"><input type="hidden" name="id" value={s.id} /><input name="name" className="input flex-1" defaultValue={s.name} /><input name="default_price" type="number" className="input w-28" defaultValue={s.default_price} /><button className="btn-outline">Kaydet</button></form>
          <ul className="text-sm pl-2">{s.service_kits.map((k: any) => <li key={k.product_id} className="flex justify-between py-0.5"><span>{k.quantity} × {k.products.name}</span><form action={deleteKitItem.bind(null, s.id, k.product_id)}><button className="text-red-600 text-xs">Sil</button></form></li>)}</ul>
          <form action={saveKitItem} className="flex gap-2"><input type="hidden" name="service_id" value={s.id} /><select name="product_id" className="input flex-1" required><option value="">Pakete ürün ekle…</option>{products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input name="quantity" type="number" min={1} defaultValue={1} className="input w-16" /><button className="btn-outline">+</button></form>
        </div>)}
        <form action={saveService} className="flex gap-2"><input name="name" className="input flex-1" placeholder="Yeni hizmet adı" required /><input name="default_price" type="number" className="input w-28" placeholder="Varsayılan ₺" /><button className="btn">Ekle</button></form>
      </section>
      <section className="card space-y-2"><h2 className="font-medium">Hekimler</h2>
        {doctors?.map((d: any) => <form key={d.id} action={saveDoctor} className="flex gap-2 flex-wrap"><input type="hidden" name="id" value={d.id} /><input name="full_name" className="input flex-1 min-w-32" defaultValue={d.full_name} /><input name="specialty" className="input w-28" defaultValue={d.specialty ?? ""} placeholder="Branş" /><input name="phone" className="input w-32" defaultValue={d.phone ?? ""} placeholder="Tel" />
          <select name="profile_id" className="input w-36" defaultValue={d.profile_id ?? ""}><option value="">Giriş hesabı yok</option>{profiles?.filter(p => p.role === "hekim").map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select><button className="btn-outline">Kaydet</button></form>)}
        <form action={saveDoctor} className="flex gap-2 flex-wrap"><input name="full_name" className="input flex-1 min-w-32" placeholder="Yeni hekim adı" required /><input name="specialty" className="input w-28" placeholder="Branş" /><input name="phone" className="input w-32" placeholder="Tel" /><button className="btn">Ekle</button></form>
      </section>
      {me?.role === "admin" && <section className="card space-y-2"><h2 className="font-medium">Kullanıcılar</h2>
        <p className="text-xs text-slate-500">Yeni kullanıcı: Supabase panelinden Authentication → Users → Add user. Sonra burada rolünü seçin.</p>
        {profiles?.map(p => <form key={p.id} action={updateProfileRole} className="flex gap-2 items-center"><input type="hidden" name="id" value={p.id} /><input name="full_name" className="input flex-1" defaultValue={p.full_name} />
          <select name="role" className="input w-32" defaultValue={p.role}>{Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" name="is_active" defaultChecked={p.is_active} />Aktif</label><button className="btn-outline">Kaydet</button></form>)}
      </section>}
    </div>
  );
}
