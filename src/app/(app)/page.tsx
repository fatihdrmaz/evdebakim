import Link from "next/link";
import { CalendarDays, CalendarX, Wallet, PackageMinus, Clock, MapPin, ArrowRight, CheckCircle2, Phone, Navigation } from "lucide-react";
import { createClient, getProfile } from "@/lib/supabase/server";
import { tl } from "@/lib/format";
import { Card, Stat, StatusBadge, Avatar, Empty, ListRow } from "@/components/ui";

export default async function Home() {
  const sb = await createClient(); const p = await getProfile();
  const staff = p?.role !== "hekim";
  const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1);
  const [{ data: today }, { data: unplanned }, balRes, lowRes] = await Promise.all([
    sb.from("sessions").select("id, seq, scheduled_at, status, patients(first_name,last_name,phone,address), sales(session_count, services(name))").gte("scheduled_at", start.toISOString()).lt("scheduled_at", end.toISOString()).order("scheduled_at"),
    sb.from("sessions").select("id, seq, patients(first_name,last_name), sales(session_count, services(name))").is("scheduled_at", null).eq("status", "planlandi").limit(20),
    staff ? sb.from("sale_balances").select("id, balance, patient_id, patients(first_name,last_name), services(name)").gt("balance", 0).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
    staff ? sb.from("product_stock").select("id,name,stock,min_stock").eq("is_active", true) : Promise.resolve({ data: [] as any[] }),
  ]);
  const balances = balRes.data ?? []; const lows = (lowRes.data ?? []).filter((x: any) => x.stock <= x.min_stock);
  const totalBal = balances.reduce((a: number, b: any) => a + Number(b.balance), 0);
  const done = (today ?? []).filter((x: any) => x.status === "tamamlandi").length;
  const dateStr = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-500 capitalize">{dateStr}</p>
        <h1 className="text-2xl font-bold tracking-tight">Merhaba, {p?.full_name?.split(" ")[0]}</h1>
      </div>

      <div className={`grid gap-3 ${staff ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2"}`}>
        <Stat label="Bugün" value={`${done} / ${today?.length ?? 0}`} icon={CalendarDays} tone="blue" href="/takvim" />
        <Stat label="Planlanmamış" value={unplanned?.length ?? 0} icon={CalendarX} tone={unplanned?.length ? "amber" : "slate"} />
        {staff && <Stat label="Açık bakiye" value={tl(totalBal)} icon={Wallet} tone={totalBal > 0 ? "red" : "green"} />}
        {staff && <Stat label="Kritik stok" value={lows.length} icon={PackageMinus} tone={lows.length ? "red" : "green"} href="/stok" />}
      </div>

      <Card title="Bugünkü Seanslar" action={<Link href="/takvim" className="btn-ghost btn-sm">Takvim <ArrowRight className="size-4" /></Link>} flush>
        {!today?.length ? <Empty icon={CalendarDays} title="Bugün planlı seans yok" hint="Planlanmamış seansları aşağıdan saatlendirebilirsiniz." /> : (
          <div className="divide-rows">{today.map((x: any) => (
            <div key={x.id} className="row px-2 sm:px-3">
              <Link href={`/seans/${x.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex flex-col items-center w-12 shrink-0"><span className="text-sm font-bold num">{new Date(x.scheduled_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span></div>
                <Avatar name={`${x.patients.first_name} ${x.patients.last_name}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{x.patients.first_name} {x.patients.last_name}</div>
                  <div className="text-[13px] text-slate-500 truncate">{x.sales.services.name} · Seans {x.seq}/{x.sales.session_count}</div>
                  {x.patients.address && <div className="text-xs text-slate-400 truncate flex items-center gap-1"><MapPin className="size-3" />{x.patients.address}</div>}
                </div>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                {x.patients.phone && <a href={`tel:${x.patients.phone}`} aria-label="Ara" className="btn-icon"><Phone className="size-4" /></a>}
                {x.patients.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(x.patients.address)}`} target="_blank" rel="noopener noreferrer" aria-label="Yol tarifi" className="btn-icon"><Navigation className="size-4" /></a>}
                <StatusBadge status={x.status} />
              </div>
            </div>))}</div>)}
      </Card>

      {!!unplanned?.length && (
        <Card title={`Planlanmamış Seanslar · ${unplanned.length}`} flush>
          <div className="divide-rows">{unplanned.map((x: any) => (
            <ListRow key={x.id} href={`/seans/${x.id}`} left={<span className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Clock className="size-5" /></span>}
              title={`${x.patients.first_name} ${x.patients.last_name}`} subtitle={`${x.sales.services.name} · Seans ${x.seq}/${x.sales.session_count}`} right={<span className="btn-ghost btn-sm">Planla</span>} chevron={false} />))}</div>
        </Card>)}

      {staff && <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Açık Bakiyeler" action={<span className="text-sm font-bold text-red-600 num">{tl(totalBal)}</span>} flush>
          {!balances.length ? <Empty icon={CheckCircle2} title="Açık bakiye yok" /> : (
            <div className="divide-rows">{balances.slice(0, 8).map((b: any) => (
              <ListRow key={b.id} href={`/hastalar/${b.patient_id}`} left={<Avatar name={`${b.patients.first_name} ${b.patients.last_name}`} size="sm" />} title={`${b.patients.first_name} ${b.patients.last_name}`} subtitle={b.services.name} right={<span className="font-semibold text-red-600 num">{tl(b.balance)}</span>} />))}</div>)}
        </Card>
        <Card title="Kritik Stok" action={<Link href="/stok" className="btn-ghost btn-sm">Stok <ArrowRight className="size-4" /></Link>} flush>
          {!lows.length ? <Empty icon={CheckCircle2} title="Stok seviyeleri yeterli" /> : (
            <ul className="divide-rows">{lows.map((x: any) => <li key={x.id} className="flex items-center justify-between px-4 py-3"><span className="text-sm font-medium">{x.name}</span><span className="badge badge-red num">{x.stock} adet</span></li>)}</ul>)}
        </Card>
      </div>}
    </div>
  );
}
