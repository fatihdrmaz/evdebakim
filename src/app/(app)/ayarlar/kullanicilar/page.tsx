import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { createClient, getProfile } from "@/lib/supabase/server";
import { ROLE } from "@/lib/format";
import { updateProfileRole } from "@/lib/actions";
import { PageHeader, Card, Alert, Avatar, Field } from "@/components/ui";

export default async function Users() {
  const me = await getProfile(); if (me?.role !== "admin") redirect("/ayarlar/hizmetler");
  const sb = await createClient();
  const { data: profiles } = await sb.from("profiles").select("*").order("full_name");
  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader title="Kullanıcılar" subtitle="Rolleri ve aktiflik durumunu yönetin" />
      <Alert tone="info"><Info className="size-4 mt-0.5 shrink-0" /><span>Yeni kullanıcı eklemek için Supabase paneli → Authentication → Users → <b>Add user</b>. Hesap açıldıktan sonra burada otomatik görünür (varsayılan rol: Hemşire).</span></Alert>
      {profiles?.map(p => (
        <Card key={p.id}>
          <form action={updateProfileRole} className="grid grid-cols-2 sm:grid-cols-[auto_1fr_10rem_auto_auto] gap-3 items-end"><input type="hidden" name="id" value={p.id} />
            <div className="pb-1"><Avatar name={p.full_name} /></div>
            <Field label="Ad soyad"><input name="full_name" className="input" defaultValue={p.full_name} /></Field>
            <Field label="Rol"><select name="role" className="input" defaultValue={p.role} disabled={p.id === me.id}>{Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <label className="flex items-center gap-2 text-sm h-11"><input type="checkbox" name="is_active" defaultChecked={p.is_active} disabled={p.id === me.id} className="size-4 accent-brand-600" />Aktif</label>
            <button className="btn-secondary">Kaydet</button>
            {p.id === me.id && <><input type="hidden" name="role" value={p.role} /><input type="hidden" name="is_active" value="on" /></>}
          </form>
        </Card>))}
    </div>
  );
}
