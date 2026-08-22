import { createClient } from "@/lib/supabase/server";
import { createPurchase } from "@/lib/actions";
import PurchaseForm from "@/components/PurchaseForm";
import { PageHeader } from "@/components/ui";
export default async function NewPurchase() {
  const sb = await createClient(); const { data: products } = await sb.from("products").select("id, name").eq("is_active", true).order("name");
  return <div className="max-w-3xl"><PageHeader title="Alış Faturası" subtitle="Satın alınan ürünleri stoğa ekleyin" back="/stok" /><PurchaseForm products={products ?? []} action={createPurchase} /></div>;
}
