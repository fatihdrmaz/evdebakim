import { createClient } from "@/lib/supabase/server";
import { saveAnamnesis } from "@/lib/actions";
import { PageHeader, Card, Field } from "@/components/ui";
import AnamnesisMedicalFields from "@/components/AnamnesisMedicalFields";

export default async function Anamnez({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ back?: string }> }) {
  const { id } = await params; const { back } = await searchParams; const sb = await createClient();
  const [{ data: a }, { data: p }] = await Promise.all([sb.from("anamnesis").select("*").eq("patient_id", id).maybeSingle(), sb.from("patients").select("first_name,last_name").eq("id", id).single()]);
  const T = (n: string, l: string, v: any, ph?: string) => <Field label={l}><textarea name={n} rows={2} className="input" defaultValue={v ?? ""} placeholder={ph} /></Field>;
  return (
    <form action={saveAnamnesis} className="max-w-3xl space-y-4">
      <input type="hidden" name="patient_id" value={id} />{back && <input type="hidden" name="back" value={back} />}
      <PageHeader title="Anamnez" subtitle={p ? `${p.first_name} ${p.last_name}` : undefined} back={back ?? `/hastalar/${id}`} />
      <Card title="Ölçümler">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Boy (cm)"><input name="height_cm" type="number" inputMode="decimal" className="input" defaultValue={a?.height_cm ?? ""} /></Field>
          <Field label="Kilo (kg)"><input name="weight_kg" type="number" step="0.1" inputMode="decimal" className="input" defaultValue={a?.weight_kg ?? ""} /></Field>
        </div>
      </Card>
      <Card title="Tıbbi Öykü">
        <div className="space-y-4">
          <AnamnesisMedicalFields allergies={a?.allergies} chronicDiseases={a?.chronic_diseases} medications={a?.medications} />
          {T("surgeries", "Geçirdiği ameliyatlar", a?.surgeries)}
          {T("clinical_history", "Klinik öykü", a?.clinical_history)}
          {T("special_conditions", "Özel durumlar", a?.special_conditions, "Hareket kısıtı, pacemaker, vb.")}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {[["smoking", "Sigara", a?.smoking], ["alcohol", "Alkol", a?.alcohol], ["pregnancy", "Gebelik", a?.pregnancy]].map(([n, l, v]) => (
              <label key={n as string} className="flex items-center gap-2 min-h-11 cursor-pointer"><input type="checkbox" name={n as string} defaultChecked={!!v} className="size-5 rounded accent-brand-600" />{l}</label>))}
          </div>
        </div>
      </Card>
      <button className="btn w-full sm:w-auto sm:min-w-40">Kaydet</button>
    </form>
  );
}
