"use client";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
export default function LogoutButton() {
  const r = useRouter();
  return (
    <button type="button" aria-label="Çıkış yap" title="Çıkış yap" className="btn-icon" onClick={async () => { await createClient().auth.signOut(); r.replace("/login"); r.refresh(); }}>
      <LogOut className="size-[18px]" />
    </button>
  );
}
