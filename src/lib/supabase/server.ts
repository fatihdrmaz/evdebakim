import { createServerClient } from "@supabase/ssr";
import { createClient as createSb } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Geliştirme kolaylığı: DEV_IMPERSONATE_USER_ID tanımlıysa (yalnızca production dışı) o kullanıcı gibi davran.
export const devImpersonate =
  process.env.NODE_ENV !== "production" && process.env.DEV_IMPERSONATE_USER_ID && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.DEV_IMPERSONATE_USER_ID
    : null;

export async function createClient() {
  if (devImpersonate) {
    return createSb(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  }
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (all) => { try { all.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} },
    },
  });
}

export async function getProfile() {
  const sb = await createClient();
  const id = devImpersonate ?? (await sb.auth.getUser()).data.user?.id;
  if (!id) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", id).single();
  return data;
}
