import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { d, tl } from "@/lib/format";
import { PageHeader, Card } from "@/components/ui";

export default async function Purchase({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sb = await createClient();
  const { data: p } = await sb.from("purchases").select("*, purchase_items(id, quantity, unit_price, products(name))").eq("id", id).single();
  if (!p) notFound();
  const sum = p.purchase_items.reduce((a: number, i: any) => a + (i.unit_price ?? 0) * i.quantity, 0);
  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader back="/stok/faturalar" title={p.supplier ?? "Alış Faturası"} subtitle={<span className="num">{d(p.invoice_date)}{p.invoice_no && ` · Fatura no ${p.invoice_no}`}</span>} />
      <Card flush>
        <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>Ürün</th><th className="text-right">Adet</th><th className="text-right">Birim</th><th className="text-right">Tutar</th></tr></thead>
          <tbody>{p.purchase_items.map((i: any) => <tr key={i.id} className="num"><td className="font-medium">{i.products.name}</td><td className="text-right">{i.quantity}</td><td className="text-right">{i.unit_price != null ? tl(i.unit_price) : "—"}</td><td className="text-right">{i.unit_price != null ? tl(i.unit_price * i.quantity) : "—"}</td></tr>)}</tbody>
          <tfoot><tr className="num"><td colSpan={3} className="text-right text-slate-500 px-4 py-3">Kalem toplamı</td><td className="text-right font-bold px-4 py-3">{tl(sum)}</td></tr>
            {p.total != null && <tr className="num"><td colSpan={3} className="text-right text-slate-500 px-4 pb-3">Fatura toplamı</td><td className="text-right font-bold px-4 pb-3">{tl(p.total)}</td></tr>}</tfoot></table></div>
      </Card>
      {p.notes && <Card title="Not"><p className="text-sm">{p.notes}</p></Card>}
    </div>
  );
}
