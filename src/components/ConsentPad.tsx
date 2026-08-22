"use client";
import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Eraser, Loader2, PenLine } from "lucide-react";
import { saveConsent } from "@/lib/actions";
import { Field } from "@/components/ui";

export default function ConsentPad({ sessionId, defaultName, text }: { sessionId: string; defaultName: string; text: string }) {
  const ref = useRef<HTMLCanvasElement>(null); const pad = useRef<SignaturePad | null>(null);
  const [name, setName] = useState(defaultName); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  useEffect(() => {
    const c = ref.current!; const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const resize = () => { c.width = c.offsetWidth * ratio; c.height = c.offsetHeight * ratio; c.getContext("2d")!.scale(ratio, ratio); pad.current?.clear(); };
    resize(); pad.current = new SignaturePad(c, { backgroundColor: "rgb(255,255,255)", penColor: "#1e293b" });
    window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize);
  }, []);
  async function save() {
    if (pad.current?.isEmpty()) return setErr("Lütfen imza alanını imzalayın.");
    setBusy(true); setErr("");
    try { await saveConsent(sessionId, pad.current!.toDataURL("image/png"), name, text); } catch { setErr("Kaydedilemedi, lütfen tekrar deneyin."); setBusy(false); }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">{text}</p>
      <Field label="İmzalayan"><input className="input" value={name} onChange={e => setName(e.target.value)} /></Field>
      <div>
        <span className="label flex items-center gap-1.5"><PenLine className="size-3.5" />İmza</span>
        <canvas ref={ref} className="w-full h-44 border-2 border-dashed border-slate-300 rounded-xl bg-white touch-none" aria-label="İmza alanı" />
      </div>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary" onClick={() => pad.current?.clear()}><Eraser className="size-4" />Temizle</button>
        <button type="button" className="btn flex-1" disabled={busy} onClick={save}>{busy ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}{busy ? "Kaydediliyor…" : "Onamı Kaydet"}</button>
      </div>
    </div>
  );
}
