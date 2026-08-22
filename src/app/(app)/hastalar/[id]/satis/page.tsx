import { createClient } from "@/lib/supabase/server";
import { createSale } from "@/lib/actions";
import SaleForm from "@/components/SaleForm";
import { PageHeader } from "@/components/ui";
export default async function NewSale({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sb = await createClient();
  const [{ data: services }, { data: p }] = await Promise.all([sb.from("services").select("id, name, default_price").eq("is_active", true).order("name"), sb.from("patients").select("first_name,last_name").eq("id", id).single()]);
  return <div className="max-w-2xl"><PageHeader title="Yeni Satış" subtitle={p ? `${p.first_name} ${p.last_name}` : undefined} back={`/hastalar/${id}`} /><SaleForm patientId={id} services={services ?? []} action={createSale} /></div>;
}
