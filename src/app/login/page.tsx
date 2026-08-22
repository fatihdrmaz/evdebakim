"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function Login() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const r = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await createClient().auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) return setErr("E-posta veya şifre hatalı");
    r.replace("/"); r.refresh();
  }
  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center text-teal-700">Evde Bakım</h1>
        <div><label className="label">E-posta</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></div>
        <div><label className="label">Şifre</label><input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} required autoComplete="current-password" /></div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Giriş yapılıyor…" : "Giriş Yap"}</button>
      </form>
    </main>
  );
}
