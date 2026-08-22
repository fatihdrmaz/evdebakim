"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Field } from "@/components/ui";

export default function PurchaseForm({ products, action }: { products: any[]; action: (fd: FormData) => Promise<void> }) {
  const [rows, setRows] = useState([0, 1, 2]);
  return (
    <form action={action} className="space-y-4">
      <Card title="Fatura Bilgileri">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tedarikçi"><input name="supplier" className="input" /></Field>
          <Field label="Fatura no"><input name="invoice_no" className="input" /></Field>
          <Field label="Fatura tarihi"><input name="invoice_date" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
          <Field label="Fatura toplamı (₺)"><input name="total" type="number" step="0.01" inputMode="decimal" className="input" /></Field>
        </div>
      </Card>
      <Card title="Kalemler">
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[1fr_5rem_7rem_2.5rem] gap-2 text-xs font-medium text-slate-500 px-1"><span>Ürün</span><span>Adet</span><span>Birim ₺</span><span /></div>
          {rows.map(i => (
            <div key={i} className="grid grid-cols-[1fr_4.5rem_6rem_2.5rem] sm:grid-cols-[1fr_5rem_7rem_2.5rem] gap-2">
              <select name="product_id[]" className="input" aria-label="Ürün"><option value="">Ürün seçiniz</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <input name="quantity[]" type="number" min={0} inputMode="numeric" className="input px-2" placeholder="Adet" aria-label="Adet" />
              <input name="unit_price[]" type="number" step="0.01" inputMode="decimal" className="input px-2" placeholder="₺" aria-label="Birim fiyat" />
              <button type="button" aria-label="Satırı kaldır" className="btn-icon text-slate-400 hover:text-red-600" onClick={() => setRows(r => r.length > 1 ? r.filter(x => x !== i) : r)}><Trash2 className="size-4" /></button>
            </div>))}
          <button type="button" className="btn-ghost btn-sm" onClick={() => setRows(r => [...r, (r[r.length - 1] ?? 0) + 1])}><Plus className="size-4" />Satır ekle</button>
        </div>
      </Card>
      <Field label="Not"><input name="notes" className="input" /></Field>
      <button className="btn w-full sm:w-auto">Faturayı Kaydet</button>
      <p className="hint">Kaydedilince kalemler stoğa eklenir.</p>
    </form>
  );
}
