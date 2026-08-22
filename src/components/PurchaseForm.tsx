"use client";
import { useState } from "react";
export default function PurchaseForm({ products, action }: { products: any[]; action: (fd: FormData) => Promise<void> }) {
  const [rows, setRows] = useState([0, 1, 2]);
  return (
    <form action={action} className="card space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input name="supplier" className="input" placeholder="Tedarikçi" /><input name="invoice_no" className="input" placeholder="Fatura no" />
        <input name="invoice_date" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} /><input name="total" type="number" step="0.01" className="input" placeholder="Fatura toplamı ₺" />
      </div>
      <div className="space-y-2">{rows.map(i => <div key={i} className="flex gap-2">
        <select name="product_id[]" className="input flex-1"><option value="">Ürün…</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <input name="quantity[]" type="number" min={0} className="input w-20" placeholder="Adet" /><input name="unit_price[]" type="number" step="0.01" className="input w-24" placeholder="Birim ₺" /></div>)}</div>
      <button type="button" className="btn-outline w-full" onClick={() => setRows(r => [...r, r.length])}>+ Satır</button>
      <input name="notes" className="input" placeholder="Not" />
      <button className="btn w-full">Faturayı Kaydet (stok artar)</button>
    </form>
  );
}
