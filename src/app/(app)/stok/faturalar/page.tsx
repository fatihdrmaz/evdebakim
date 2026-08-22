import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { d, tl } from "@/lib/format";
import { PageHeader, Card, Empty, ListRow } from "@/components/ui";

export default async function Purchases() {
  const sb = await createClient();
  const { data } = await sb.from("purchases").select("id, supplier, invoice_no, invoice_date, total, purchase_items(quantity)").order("invoice_date", { ascending: false }).order("created_at", { ascending: false });
  return (
    <div>
      <PageHeader title="Alış Faturaları" subtitle={`${data?.length ?? 0} fatura`} action={<Link href="/stok/alis" className="btn"><Plus className="size-4" />Yeni Fatura</Link>} />
      <Card flush>
        {!data?.length ? <Empty icon={FileText} title="Alış faturası yok" hint="Satın aldığınız ürünleri fatura olarak girin; stok otomatik artar." action={<Link href="/stok/alis" className="btn"><Plus className="size-4" />Yeni Fatura</Link>} /> : (
          <div className="divide-rows">{data.map((p: any) => (
            <ListRow key={p.id} href={`/stok/faturalar/${p.id}`} left={<span className="size-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><FileText className="size-5" /></span>}
              title={p.supplier ?? "Tedarikçi belirtilmedi"} subtitle={<span className="num">{d(p.invoice_date)}{p.invoice_no && ` · Fatura ${p.invoice_no}`} · {p.purchase_items.reduce((a: number, i: any) => a + i.quantity, 0)} adet</span>}
              right={p.total != null && <b className="num">{tl(p.total)}</b>} />))}</div>)}
      </Card>
    </div>
  );
}
