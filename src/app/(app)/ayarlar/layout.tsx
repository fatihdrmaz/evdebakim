import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import SubNav from "@/components/SubNav";
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const me = await getProfile(); if (me?.role === "hekim") redirect("/");
  const items = [{ href: "/ayarlar/hizmetler", label: "Hizmetler & Paketler" }, { href: "/ayarlar/hekimler", label: "Hekimler" }];
  if (me?.role === "admin") items.push({ href: "/ayarlar/kullanicilar", label: "Kullanıcılar" });
  return <div><SubNav items={items} />{children}</div>;
}
