"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
export default function LogoutButton() {
  const r = useRouter();
  return <button className="block mt-2 text-red-600 underline" onClick={async () => { await createClient().auth.signOut(); r.replace("/login"); }}>Çıkış</button>;
}
