import Link from "next/link";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { STATUS } from "@/lib/format";

export function PageHeader({ title, subtitle, back, action }: { title: React.ReactNode; subtitle?: React.ReactNode; back?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-4 sm:mb-6">
      {back && <Link href={back} aria-label="Geri" className="btn-icon -ml-2 shrink-0"><ChevronLeft className="size-5" /></Link>}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex gap-2">{action}</div>}
    </div>
  );
}

export function Card({ title, action, children, className = "", flush = false }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          {title && <h2 className="card-title">{title}</h2>}
          {action}
        </header>
      )}
      <div className={flush ? "" : title ? "px-4 sm:px-5 pb-4 sm:pb-5" : "card-pad"}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, icon: Icon, tone = "slate", href }: { label: string; value: React.ReactNode; icon: LucideIcon; tone?: "slate" | "blue" | "green" | "red" | "amber"; href?: string }) {
  const tones = { slate: "bg-slate-100 text-slate-600", blue: "bg-brand-50 text-brand-600", green: "bg-emerald-50 text-emerald-600", red: "bg-red-50 text-red-600", amber: "bg-amber-50 text-amber-600" };
  const inner = (
    <div className="card card-pad flex items-center gap-3 h-full">
      <span className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}><Icon className="size-5" /></span>
      <div className="min-w-0"><div className="text-xs font-medium text-slate-500 truncate">{label}</div><div className="text-lg font-bold text-slate-900 num truncate">{value}</div></div>
    </div>
  );
  return href ? <Link href={href} className="block transition-transform active:scale-[0.99]">{inner}</Link> : inner;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "tamamlandi" ? "badge-green" : status === "iptal" ? "badge-slate" : "badge-amber";
  return <span className={`badge ${tone}`}>{STATUS[status] ?? status}</span>;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const sz = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" }[size];
  return <span className={`${sz} rounded-full flex items-center justify-center font-semibold shrink-0`} style={{ background: `hsl(${hue} 70% 92%)`, color: `hsl(${hue} 60% 30%)` }} aria-hidden>{initials}</span>;
}

export function Empty({ icon: Icon, title, hint, action }: { icon: LucideIcon; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <span className="size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3"><Icon className="size-6" /></span>
      <p className="font-medium text-slate-800">{title}</p>
      {hint && <p className="text-sm text-slate-500 mt-1 max-w-xs">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({ label, required, hint, children, className = "" }: { label: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export function ListRow({ href, left, title, subtitle, right, chevron = true }: { href: string; left?: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode; right?: React.ReactNode; chevron?: boolean }) {
  return (
    <Link href={href} className="row">
      {left}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900 truncate">{title}</div>
        {subtitle && <div className="text-[13px] text-slate-500 truncate">{subtitle}</div>}
      </div>
      {right}
      {chevron && <ChevronRight className="size-4 text-slate-300 shrink-0" />}
    </Link>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "warn" | "danger" | "success"; children: React.ReactNode }) {
  const t = { info: "bg-brand-50 text-brand-800 border-brand-200", warn: "bg-amber-50 text-amber-900 border-amber-200", danger: "bg-red-50 text-red-800 border-red-200", success: "bg-emerald-50 text-emerald-800 border-emerald-200" }[tone];
  return <div className={`rounded-xl border px-3.5 py-2.5 text-sm flex items-start gap-2 ${t}`}>{children}</div>;
}
