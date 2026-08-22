import { createClient } from "@/lib/supabase/server";
import { saveAnamnesis } from "@/lib/actions";
const T = (n: string, l: string, v: any) => <div><label className="label">{l}</label><textarea name={n} rows={2} className="input" defaultValue={v ?? ""} /></div>;
export default async function Anamnez({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sb = await createClient();
  const { data: a } = await sb.from("anamnesis").select("*").eq("patient_id", id).maybeSingle();
  return (
    <form action={saveAnamnesis} className="card space-y-3">
      <input type="hidden" name="patient_id" value={id} />
      <h1 className="text-xl font-semibold">Anamnez</h1>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Boy (cm)</label><input name="height_cm" type="number" inputMode="decimal" className="input" defaultValue={a?.height_cm ?? ""} /></div>
        <div><label className="label">Kilo (kg)</label><input name="weight_kg" type="number" step="0.1" inputMode="decimal" className="input" defaultValue={a?.weight_kg ?? ""} /></div>
      </div>
      {T("allergies", "Alerjiler", a?.allergies)}
      {T("chronic_diseases", "Kronik hastalıklar", a?.chronic_diseases)}
      {T("medications", "Kullandığı ilaçlar", a?.medications)}
      {T("surgeries", "Geçirdiği ameliyatlar", a?.surgeries)}
      {T("clinical_history", "Klinik öykü", a?.clinical_history)}
      {T("special_conditions", "Özel durumlar", a?.special_conditions)}
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1"><input type="checkbox" name="smoking" defaultChecked={a?.smoking} /> Sigara</label>
        <label className="flex items-center gap-1"><input type="checkbox" name="alcohol" defaultChecked={a?.alcohol} /> Alkol</label>
        <label className="flex items-center gap-1"><input type="checkbox" name="pregnancy" defaultChecked={a?.pregnancy} /> Gebelik</label>
      </div>
      <button className="btn w-full">Kaydet</button>
    </form>
  );
}
