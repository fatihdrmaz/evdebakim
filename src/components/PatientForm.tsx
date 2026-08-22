import { savePatient } from "@/lib/actions";
export default function PatientForm({ p, doctors }: { p?: any; doctors: any[] }) {
  return (
    <form action={savePatient} className="card space-y-3">
      {p?.id && <input type="hidden" name="id" value={p.id} />}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Ad *</label><input name="first_name" className="input" required defaultValue={p?.first_name} /></div>
        <div><label className="label">Soyad *</label><input name="last_name" className="input" required defaultValue={p?.last_name} /></div>
      </div>
      <div><label className="label">Telefon *</label><input name="phone" type="tel" className="input" required defaultValue={p?.phone} /></div>
      <div><label className="label">Yönlendiren Hekim</label><select name="doctor_id" className="input" defaultValue={p?.doctor_id ?? ""}><option value="">—</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Uyruk</label><select name="nationality" className="input" defaultValue={p?.nationality ?? "tc"}><option value="tc">T.C.</option><option value="yabanci">Yabancı</option></select></div>
        <div><label className="label">Cinsiyet</label><select name="gender" className="input" defaultValue={p?.gender ?? ""}><option value="">—</option><option value="K">Kadın</option><option value="E">Erkek</option></select></div>
        <div><label className="label">TC Kimlik No</label><input name="tc_no" inputMode="numeric" maxLength={11} className="input" defaultValue={p?.tc_no} /></div>
        <div><label className="label">Pasaport No</label><input name="passport_no" className="input" defaultValue={p?.passport_no} /></div>
        <div><label className="label">Doğum Tarihi</label><input name="birth_date" type="date" className="input" defaultValue={p?.birth_date} /></div>
      </div>
      <div><label className="label">Adres</label><textarea name="address" className="input" rows={2} defaultValue={p?.address} /></div>
      <div><label className="label">Not</label><textarea name="notes" className="input" rows={2} defaultValue={p?.notes} /></div>
      <button className="btn w-full">Kaydet</button>
    </form>
  );
}
