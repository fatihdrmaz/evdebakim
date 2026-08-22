import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSale } from "@/lib/actions";
import SaleForm from "@/components/SaleForm";
import { PageHeader } from "@/components/ui";
export default async function NewSale({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sb = await createClient();
  const [{ data: services }, { data: e }] = await Promise.all([sb.from("services").select("id, name, default_price").eq("is_active", true).order("name"), sb.from("encounters").select("id, patient_id, patients(first_name,last_name)").eq("id", id).single()]);
  if (!e) notFound();
  const p: any = e.patients;
  return <div className="max-w-2xl"><PageHeader title="Hizmet Ekle" subtitle={`${p.first_name} ${p.last_name}`} back={`/muayene/${id}`} /><SaleForm patientId={e.patient_id} encounterId={id} services={services ?? []} action={createSale} /></div>;
}
