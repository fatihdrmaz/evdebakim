export const TZ = "Europe/Istanbul";
export const tl = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(n ?? 0));
export const dt = (s?: string | null) => s ? new Date(s).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: TZ }) : "-";
export const d = (s?: string | null) => s ? new Date(s).toLocaleDateString("tr-TR", { timeZone: TZ }) : "-";
export const t = (s?: string | null) => s ? new Date(s).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "-";
/** Kullanıcının Türkiye saatiyle girdiği "YYYY-MM-DD" + "HH:mm" değerlerini doğru UTC ISO zamanına çevirir (TR yıl boyu UTC+3, DST yok). */
export const trToISO = (dateOrDatetimeLocal: string, time?: string) => {
  const datePart = dateOrDatetimeLocal.slice(0, 10);
  const timePart = time ?? dateOrDatetimeLocal.slice(11, 16) ?? "00:00";
  return new Date(`${datePart}T${timePart}:00+03:00`).toISOString();
};
/** UTC ISO zamanını <input type="datetime-local"> için Türkiye saatiyle "YYYY-MM-DDTHH:mm" değerine çevirir. */
export const toIstanbulInputValue = (iso?: string | null) => {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find(p => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};
/** "Şimdi"nin Türkiye takvim gününe göre gece yarısı sınırlarını UTC olarak döndürür. */
export const todayRangeIstanbul = () => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const start = new Date(`${parts}T00:00:00+03:00`);
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};
export const STATUS: Record<string, string> = { planlandi: "Planlandı", tamamlandi: "Tamamlandı", iptal: "İptal" };
export const METHOD: Record<string, string> = { nakit: "Nakit", kart: "Kredi Kartı", havale: "Havale" };
export const ROLE: Record<string, string> = { admin: "Yönetici", hemsire: "Hemşire", sekreter: "Sekreter", hekim: "Hekim" };
export const CAT: Record<string, string> = { serum: "Serum", ilac: "İlaç", sarf: "Sarf" };
