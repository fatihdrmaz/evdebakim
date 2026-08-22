import { createClient } from "@/lib/supabase/server";
import { createSale } from "@/lib/actions";
import SaleForm from "@/components/SaleForm";
export default async function NewSale({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sb = await createClient();
  const { data: services } = await sb.from("services").select("id, name, default_price").eq("is_active", true).order("name");
  return <div className="space-y-4"><h1 className="text-xl font-semibold">Yeni Satış</h1><SaleForm patientId={id} services={services ?? []} action={createSale} /></div>;
}
