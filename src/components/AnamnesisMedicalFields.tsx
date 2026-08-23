"use client";
import { useState } from "react";
import { Field } from "@/components/ui";

const CHRONIC_OPTIONS = ["Hipertansiyon", "Kolesterol", "Diyabet", "KOAH"];
const MED_OPTIONS = ["Deltacortril", "Ürikoliz", "PROGRAF", "Novorapid", "Lantus", "Norvasc", "Pantpas", "Beloc"];

const splitList = (v?: string | null) => (v ?? "").split(",").map(s => s.trim()).filter(Boolean);

export default function AnamnesisMedicalFields({ allergies, chronicDiseases, medications }: { allergies?: string | null; chronicDiseases?: string | null; medications?: string | null }) {
  const [allergyYn, setAllergyYn] = useState<"yok" | "var">(allergies ? "var" : "yok");

  const chronicItems = splitList(chronicDiseases);
  const chronicOther = chronicItems.filter(i => !CHRONIC_OPTIONS.includes(i)).join(", ");
  const [chronicOtherOn, setChronicOtherOn] = useState(chronicOther.length > 0);

  const medItems = splitList(medications);
  const medOther = medItems.filter(i => !MED_OPTIONS.includes(i)).join(", ");

  return (
    <>
      <div>
        <span className="label">İlaç, gıda, toz vb. alerji var mı?</span>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 cursor-pointer min-h-9"><input type="radio" name="allergy_yn" value="yok" checked={allergyYn === "yok"} onChange={() => setAllergyYn("yok")} className="size-4 accent-brand-600" />Yok</label>
          <label className="flex items-center gap-2 cursor-pointer min-h-9"><input type="radio" name="allergy_yn" value="var" checked={allergyYn === "var"} onChange={() => setAllergyYn("var")} className="size-4 accent-brand-600" />Var</label>
        </div>
        {allergyYn === "var" && <input name="allergy_detail" className="input mt-2" defaultValue={allergies ?? ""} placeholder="Ne olduğunu yazın: örn. penisilin, fıstık, polen" autoFocus />}
      </div>

      <div>
        <span className="label">Kronik hastalıklar</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
          {CHRONIC_OPTIONS.map(o => (
            <label key={o} className="flex items-center gap-2 cursor-pointer min-h-9"><input type="checkbox" name="chronic" value={o} defaultChecked={chronicItems.includes(o)} className="size-4 rounded accent-brand-600" />{o}</label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer min-h-9"><input type="checkbox" name="chronic_other_on" checked={chronicOtherOn} onChange={e => setChronicOtherOn(e.target.checked)} className="size-4 rounded accent-brand-600" />Diğer</label>
        </div>
        {chronicOtherOn && <input name="chronic_other_text" className="input mt-2" defaultValue={chronicOther} placeholder="Diğer kronik hastalığı yazın" autoFocus />}
      </div>

      <div>
        <span className="label">Kullandığı ilaçlar</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
          {MED_OPTIONS.map(o => (
            <label key={o} className="flex items-center gap-2 cursor-pointer min-h-9"><input type="checkbox" name="med" value={o} defaultChecked={medItems.includes(o)} className="size-4 rounded accent-brand-600" />{o}</label>
          ))}
        </div>
        <Field label="Diğer ilaçlar" className="mt-2" hint="Yukarıda olmayan ilaçları buraya yazın"><input name="med_other" className="input" defaultValue={medOther} placeholder="İlaç adı ve dozu" /></Field>
      </div>
    </>
  );
}
