import PatientForm from "@/components/PatientForm";
import { PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
export default async function NewPatient() {
  const sb = await createClient(); const { data: doctors } = await sb.from("doctors").select("id, full_name").order("full_name");
  return <div className="max-w-3xl"><PageHeader title="Yeni Hasta" back="/hastalar" /><PatientForm doctors={doctors ?? []} /></div>;
}
