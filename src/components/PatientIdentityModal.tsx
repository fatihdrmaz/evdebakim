"use client";
import { useRef } from "react";
import { IdCard } from "lucide-react";
import { updatePatientIdentity } from "@/lib/actions";
import { Field } from "@/components/ui";

export default function PatientIdentityModal({ p, back }: { p: any; back: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="font-semibold underline shrink-0">Şimdi düzelt</button>
      <dialog ref={ref} className="rounded-2xl p-0 w-[min(92vw,28rem)] backdrop:bg-slate-900/40">
        <form action={updatePatientIdentity} className="p-5 space-y-4">
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="back" value={back} />
          <div className="flex items-center gap-2"><IdCard className="size-5 text-brand-600" /><h2 className="text-lg font-bold">Kimlik Bilgilerini Tamamla</h2></div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ad" required><input name="first_name" className="input" required defaultValue={p.first_name ?? ""} /></Field>
            <Field label="Soyad" required><input name="last_name" className="input" required defaultValue={p.last_name ?? ""} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Uyruk"><select name="nationality" className="input" defaultValue={p.nationality ?? "tc"}><option value="tc">T.C. Vatandaşı</option><option value="yabanci">Yabancı Uyruklu</option></select></Field>
            <Field label="Cinsiyet"><select name="gender" className="input" defaultValue={p.gender ?? ""}><option value="">Belirtilmedi</option><option value="K">Kadın</option><option value="E">Erkek</option></select></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="TC Kimlik No" hint="T.C. vatandaşları için"><input name="tc_no" inputMode="numeric" maxLength={11} pattern="[0-9]{11}" className="input" defaultValue={p.tc_no ?? ""} /></Field>
            <Field label="Pasaport No" hint="Yabancı uyruklular için"><input name="passport_no" className="input" defaultValue={p.passport_no ?? ""} /></Field>
          </div>
          <Field label="Doğum Tarihi"><input name="birth_date" type="date" className="input" defaultValue={p.birth_date ?? ""} /></Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => ref.current?.close()} className="btn-secondary flex-1">Vazgeç</button>
            <button className="btn flex-1">Kaydet</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
