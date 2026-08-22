"use client";
import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { saveConsent } from "@/lib/actions";
export default function ConsentPad({ sessionId, defaultName, text }: { sessionId: string; defaultName: string; text: string }) {
  const ref = useRef<HTMLCanvasElement>(null); const pad = useRef<SignaturePad | null>(null);
  const [name, setName] = useState(defaultName); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  useEffect(() => {
    const c = ref.current!; const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const resize = () => { c.width = c.offsetWidth * ratio; c.height = c.offsetHeight * ratio; c.getContext("2d")!.scale(ratio, ratio); pad.current?.clear(); };
    resize(); pad.current = new SignaturePad(c, { backgroundColor: "rgb(255,255,255)" });
    window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize);
  }, []);
  async function save() {
    if (pad.current?.isEmpty()) return setErr("Lütfen imzalayın.");
    setBusy(true); setErr("");
    try { await saveConsent(sessionId, pad.current!.toDataURL("image/png"), name, text); } catch { setErr("Kaydedilemedi."); setBusy(false); }
  }
  return (
    <div className="space-y-2">
      <p className="text-sm bg-slate-50 rounded-lg p-3 leading-relaxed">{text}</p>
      <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="İmzalayan ad soyad" />
      <canvas ref={ref} className="w-full h-40 border-2 border-dashed border-slate-300 rounded-lg bg-white touch-none" />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-2"><button type="button" className="btn-outline" onClick={() => pad.current?.clear()}>Temizle</button><button type="button" className="btn flex-1" disabled={busy} onClick={save}>{busy ? "Kaydediliyor…" : "Onamı Kaydet"}</button></div>
    </div>
  );
}
