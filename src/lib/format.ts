export const tl = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(n ?? 0));
export const dt = (s?: string | null) => s ? new Date(s).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "-";
export const d = (s?: string | null) => s ? new Date(s).toLocaleDateString("tr-TR") : "-";
export const STATUS: Record<string, string> = { planlandi: "Planlandı", tamamlandi: "Tamamlandı", iptal: "İptal" };
export const METHOD: Record<string, string> = { nakit: "Nakit", kart: "Kredi Kartı", havale: "Havale" };
export const ROLE: Record<string, string> = { admin: "Yönetici", hemsire: "Hemşire", sekreter: "Sekreter", hekim: "Hekim" };
export const CAT: Record<string, string> = { serum: "Serum", ilac: "İlaç", sarf: "Sarf" };
