import PatientForm from "@/components/PatientForm";
import { createClient } from "@/lib/supabase/server";
export default async function NewPatient() {
  const sb = await createClient(); const { data: doctors } = await sb.from("doctors").select("id, full_name").order("full_name");
  return <div className="space-y-4"><h1 className="text-xl font-semibold">Yeni Hasta</h1><PatientForm doctors={doctors ?? []} /></div>;
}
