import { savePatient } from "@/lib/actions";
import { Card, Field } from "@/components/ui";

export default function PatientForm({ p, doctors }: { p?: any; doctors: any[] }) {
  return (
    <form action={savePatient} className="space-y-4">
      {p?.id && <input type="hidden" name="id" value={p.id} />}
      <Card title="Kimlik Bilgileri">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Ad" required><input name="first_name" className="input" required defaultValue={p?.first_name} autoComplete="off" /></Field>
          <Field label="Soyad" required><input name="last_name" className="input" required defaultValue={p?.last_name} autoComplete="off" /></Field>
          <Field label="Telefon" required><input name="phone" type="tel" inputMode="tel" className="input" required defaultValue={p?.phone} placeholder="05xx xxx xx xx" /></Field>
          <Field label="Yönlendiren Hekim"><select name="doctor_id" className="input" defaultValue={p?.doctor_id ?? ""}><option value="">Seçiniz</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></Field>
          <Field label="Uyruk"><select name="nationality" className="input" defaultValue={p?.nationality ?? "tc"}><option value="tc">T.C. Vatandaşı</option><option value="yabanci">Yabancı Uyruklu</option></select></Field>
          <Field label="Cinsiyet"><select name="gender" className="input" defaultValue={p?.gender ?? ""}><option value="">Belirtilmedi</option><option value="K">Kadın</option><option value="E">Erkek</option></select></Field>
          <Field label="TC Kimlik No" hint="T.C. vatandaşları için"><input name="tc_no" inputMode="numeric" maxLength={11} pattern="[0-9]{11}" className="input" defaultValue={p?.tc_no} /></Field>
          <Field label="Pasaport No" hint="Yabancı uyruklular için"><input name="passport_no" className="input" defaultValue={p?.passport_no} /></Field>
          <Field label="Doğum Tarihi"><input name="birth_date" type="date" className="input" defaultValue={p?.birth_date} /></Field>
        </div>
      </Card>
      <Card title="İletişim & Notlar">
        <div className="space-y-4">
          <Field label="Adres"><textarea name="address" className="input" rows={2} defaultValue={p?.address} placeholder="Mahalle, sokak, bina, daire" /></Field>
          <Field label="Not"><textarea name="notes" className="input" rows={2} defaultValue={p?.notes} /></Field>
        </div>
      </Card>
      <button className="btn w-full sm:w-auto sm:min-w-40">Kaydet</button>
    </form>
  );
}
