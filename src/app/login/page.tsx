"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [show, setShow] = useState(false);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const r = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await createClient().auth.signInWithPassword({ email, password: pw });
    if (error) { setBusy(false); return setErr("E-posta veya şifre hatalı. Lütfen tekrar deneyin."); }
    r.replace("/"); r.refresh();
  }
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-slate-100">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <span className="size-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/25"><HeartPulse className="size-7" /></span>
          <h1 className="text-2xl font-bold mt-4">Evde Bakım</h1>
          <p className="text-sm text-slate-500 mt-1">Hasta, seans ve stok yönetimi</p>
        </div>
        <form onSubmit={submit} className="card card-pad space-y-4">
          <label className="block"><span className="label">E-posta</span><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" autoFocus /></label>
          <label className="block"><span className="label">Şifre</span>
            <span className="relative block"><input className="input pr-12" type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} required autoComplete="current-password" />
              <button type="button" aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"} className="absolute right-1 top-1/2 -translate-y-1/2 btn-icon size-9" onClick={() => setShow(s => !s)}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>
          {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
          <button className="btn w-full" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}{busy ? "Giriş yapılıyor…" : "Giriş Yap"}</button>
        </form>
      </div>
    </main>
  );
}
