import { createClient } from "@/lib/supabase/server";
import { createPurchase } from "@/lib/actions";
import PurchaseForm from "@/components/PurchaseForm";
export default async function NewPurchase() {
  const sb = await createClient(); const { data: products } = await sb.from("products").select("id, name").eq("is_active", true).order("name");
  return <div className="space-y-4"><h1 className="text-xl font-semibold">Alış Faturası</h1><PurchaseForm products={products ?? []} action={createPurchase} /></div>;
}
