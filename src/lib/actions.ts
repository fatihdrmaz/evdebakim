"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const s = (fd: FormData, k: string) => { const v = fd.get(k); return v === null || v === "" ? null : String(v); };
const n = (fd: FormData, k: string) => { const v = s(fd, k); return v === null ? null : Number(v.replace(",", ".")); };

// ---------- HASTA ----------
export async function savePatient(fd: FormData) {
  const sb = await createClient();
  const id = s(fd, "id");
  const row = {
    first_name: s(fd, "first_name"), last_name: s(fd, "last_name"), phone: s(fd, "phone"),
    nationality: s(fd, "nationality"), tc_no: s(fd, "tc_no"), passport_no: s(fd, "passport_no"),
    birth_date: s(fd, "birth_date"), gender: s(fd, "gender"), address: s(fd, "address"), doctor_id: s(fd, "doctor_id"), notes: s(fd, "notes"),
    updated_at: new Date().toISOString(),
  };
  if (id) { const { error } = await sb.from("patients").update(row).eq("id", id); if (error) throw error; revalidatePath("/hastalar"); redirect(`/hastalar/${id}`); }
  const { data, error } = await sb.from("patients").insert(row).select("id").single(); if (error) throw error;
  // Yeni hasta → doğrudan ilk muayeneyi aç
  const { data: enc, error: e2 } = await sb.from("encounters").insert({ patient_id: data.id, doctor_id: row.doctor_id }).select("id").single(); if (e2) throw e2;
  revalidatePath("/hastalar"); redirect(`/muayene/${enc.id}`);
}

export async function saveAnamnesis(fd: FormData) {
  const sb = await createClient();
  const patient_id = s(fd, "patient_id")!;
  const allergies = s(fd, "allergy_yn") === "var" ? (s(fd, "allergy_detail") ?? "Var") : null;
  const chronicOther = fd.get("chronic_other_on") === "on" ? s(fd, "chronic_other_text") : null;
  const chronic_diseases = [...fd.getAll("chronic").map(String), ...(chronicOther ? [chronicOther] : [])].join(", ") || null;
  const medOther = s(fd, "med_other");
  const medications = [...fd.getAll("med").map(String), ...(medOther ? [medOther] : [])].join(", ") || null;
  const { error } = await sb.from("anamnesis").upsert({
    patient_id, height_cm: n(fd, "height_cm"), weight_kg: n(fd, "weight_kg"),
    chronic_diseases, surgeries: s(fd, "surgeries"), allergies,
    medications, clinical_history: s(fd, "clinical_history"), special_conditions: s(fd, "special_conditions"),
    smoking: fd.get("smoking") === "on", alcohol: fd.get("alcohol") === "on", pregnancy: fd.get("pregnancy") === "on",
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  const back = s(fd, "back") ?? `/hastalar/${patient_id}`;
  revalidatePath(back); redirect(back);
}

// ---------- MUAYENE ----------
export async function createEncounter(fd: FormData) {
  const sb = await createClient();
  const patient_id = s(fd, "patient_id")!;
  const { data, error } = await sb.from("encounters").insert({ patient_id, doctor_id: s(fd, "doctor_id"), complaint: s(fd, "complaint"), opened_at: s(fd, "opened_at") ?? undefined }).select("id").single();
  if (error) throw error;
  revalidatePath(`/hastalar/${patient_id}`); redirect(`/muayene/${data.id}`);
}

export async function updateEncounter(fd: FormData) {
  const sb = await createClient();
  const id = s(fd, "id")!;
  const { error } = await sb.from("encounters").update({ doctor_id: s(fd, "doctor_id"), opened_at: s(fd, "opened_at") ?? undefined, complaint: s(fd, "complaint"), diagnosis: s(fd, "diagnosis"), plan: s(fd, "plan"), notes: s(fd, "notes"), updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  revalidatePath(`/muayene/${id}`);
}

export async function setEncounterStatus(id: string, status: "acik" | "kapali") {
  const sb = await createClient();
  const { error } = await sb.from("encounters").update({ status, closed_at: status === "kapali" ? new Date().toISOString().slice(0, 10) : null }).eq("id", id);
  if (error) throw error;
  revalidatePath(`/muayene/${id}`);
}

// ---------- SATIŞ & ÖDEME ----------
export async function createSale(fd: FormData) {
  const sb = await createClient();
  const encounter_id = s(fd, "encounter_id")!;
  const { error } = await sb.from("sales").insert({
    encounter_id, patient_id: s(fd, "patient_id"), service_id: s(fd, "service_id"), session_count: n(fd, "session_count"), unit_price: n(fd, "unit_price"), payer: s(fd, "payer"), notes: s(fd, "notes"),
  });
  if (error) throw error;
  revalidatePath(`/muayene/${encounter_id}`); redirect(`/muayene/${encounter_id}`);
}

export async function addPayment(fd: FormData) {
  const sb = await createClient();
  const { error } = await sb.from("payments").insert({ sale_id: s(fd, "sale_id"), amount: n(fd, "amount"), method: s(fd, "method"), paid_at: s(fd, "paid_at") ?? undefined, notes: s(fd, "notes") });
  if (error) throw error;
  revalidatePath(`/muayene/${s(fd, "encounter_id")}`);
}

export async function addPrescription(fd: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const encounter_id = s(fd, "encounter_id")!;
  const file = fd.get("file") as File;
  if (!file || file.size === 0) throw new Error("Dosya seçilmedi");
  const ext = file.name.split(".").pop() || "pdf";
  const path = `${encounter_id}/${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: e1 } = await sb.storage.from("prescriptions").upload(path, bytes, { contentType: file.type || "application/octet-stream" });
  if (e1) throw e1;
  const { error } = await sb.from("prescriptions").insert({ encounter_id, file_path: path, file_name: file.name, notes: s(fd, "notes"), uploaded_by: user?.id });
  if (error) throw error;
  revalidatePath(`/muayene/${encounter_id}`);
}

export async function deletePrescription(id: string, encounter_id: string, file_path: string) {
  const sb = await createClient();
  await sb.storage.from("prescriptions").remove([file_path]);
  await sb.from("prescriptions").delete().eq("id", id);
  revalidatePath(`/muayene/${encounter_id}`);
}

// ---------- SEANS ----------
export async function scheduleSession(fd: FormData) {
  const sb = await createClient();
  const id = s(fd, "id")!;
  const { error } = await sb.from("sessions").update({ scheduled_at: s(fd, "scheduled_at") ? new Date(s(fd, "scheduled_at")!).toISOString() : null, nurse_id: s(fd, "nurse_id") }).eq("id", id);
  if (error) throw error;
  revalidatePath("/takvim"); revalidatePath("/"); revalidatePath(`/seans/${id}`);
}

/** Hızlı planlama: planlanmamış (veya tümü) seansları başlangıç gününden itibaren ardışık günlere aynı saate dağıt. */
export async function bulkSchedule(fd: FormData) {
  const sb = await createClient();
  const sale_id = s(fd, "sale_id")!; const encounter_id = s(fd, "encounter_id")!;
  const startDate = s(fd, "start_date")!; const time = s(fd, "time") ?? "10:00"; const nurse_id = s(fd, "nurse_id");
  const skipWeekends = fd.get("skip_weekends") === "on"; const onlyUnscheduled = fd.get("only_unscheduled") === "on";
  const every = Math.max(1, n(fd, "every_days") ?? 1);
  let q = sb.from("sessions").select("id, seq, scheduled_at").eq("sale_id", sale_id).eq("status", "planlandi").order("seq");
  if (onlyUnscheduled) q = q.is("scheduled_at", null);
  const { data: sessions, error } = await q; if (error) throw error;
  const [h, m] = time.split(":").map(Number);
  const cur = new Date(`${startDate}T00:00:00`); cur.setHours(h, m, 0, 0);
  for (const sess of sessions ?? []) {
    while (skipWeekends && (cur.getDay() === 0 || cur.getDay() === 6)) cur.setDate(cur.getDate() + 1);
    const { error: e } = await sb.from("sessions").update({ scheduled_at: cur.toISOString(), ...(nurse_id ? { nurse_id } : {}) }).eq("id", sess.id); if (e) throw e;
    cur.setDate(cur.getDate() + every);
  }
  revalidatePath(`/muayene/${encounter_id}`); revalidatePath("/takvim"); revalidatePath("/");
}

export async function setSessionStatus(id: string, status: string, encounter_id?: string) {
  const sb = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "tamamlandi") patch.completed_at = new Date().toISOString();
  const { error } = await sb.from("sessions").update(patch).eq("id", id);
  if (error) throw error;
  revalidatePath(`/seans/${id}`); revalidatePath("/takvim"); revalidatePath("/"); if (encounter_id) revalidatePath(`/muayene/${encounter_id}`);
  if (status === "tamamlandi" && encounter_id) redirect(`/muayene/${encounter_id}`);
}

export async function saveSessionNotes(fd: FormData) {
  const sb = await createClient();
  const id = s(fd, "id")!;
  const { error } = await sb.from("sessions").update({ notes: s(fd, "notes") }).eq("id", id);
  if (error) throw error;
  revalidatePath(`/seans/${id}`);
}

export async function addVital(fd: FormData) {
  const sb = await createClient();
  const session_id = s(fd, "session_id")!;
  const { error } = await sb.from("vitals").insert({
    session_id, phase: s(fd, "phase"), bp_sys: n(fd, "bp_sys"), bp_dia: n(fd, "bp_dia"), pulse: n(fd, "pulse"), temp: n(fd, "temp"), spo2: n(fd, "spo2"), glucose: n(fd, "glucose"), notes: s(fd, "notes"),
  });
  if (error) throw error;
  revalidatePath(`/seans/${session_id}`);
}

export async function updateVital(fd: FormData) {
  const sb = await createClient();
  const id = s(fd, "id")!; const session_id = s(fd, "session_id")!;
  const { error } = await sb.from("vitals").update({
    bp_sys: n(fd, "bp_sys"), bp_dia: n(fd, "bp_dia"), pulse: n(fd, "pulse"), temp: n(fd, "temp"), spo2: n(fd, "spo2"), glucose: n(fd, "glucose"), notes: s(fd, "notes"),
  }).eq("id", id);
  if (error) throw error;
  revalidatePath(`/seans/${session_id}`);
}

export async function deleteVital(id: string, session_id: string) {
  const sb = await createClient();
  await sb.from("vitals").delete().eq("id", id);
  revalidatePath(`/seans/${session_id}`);
}

export async function applyKit(session_id: string) {
  const sb = await createClient();
  const { error } = await sb.rpc("apply_service_kit", { p_session_id: session_id });
  if (error) throw error;
  revalidatePath(`/seans/${session_id}`);
}

export async function addStockMove(fd: FormData) {
  const sb = await createClient();
  const session_id = s(fd, "session_id");
  const qty = Math.abs(n(fd, "quantity") ?? 0);
  const type = s(fd, "type") ?? (session_id ? "seans_dusum" : "manuel_dusum");
  const { error } = await sb.from("stock_moves").insert({ product_id: s(fd, "product_id"), quantity: type === "duzeltme" ? (n(fd, "quantity") ?? 0) : -qty, type, session_id, notes: s(fd, "notes") });
  if (error) throw error;
  if (session_id) revalidatePath(`/seans/${session_id}`); revalidatePath("/stok");
}

export async function deleteStockMove(id: string, session_id?: string) {
  const sb = await createClient();
  await sb.from("stock_moves").delete().eq("id", id);
  if (session_id) revalidatePath(`/seans/${session_id}`); revalidatePath("/stok");
}

export async function deleteConsent(session_id: string, signature_path: string) {
  const sb = await createClient();
  await sb.storage.from("consents").remove([signature_path]);
  await sb.from("consents").delete().eq("session_id", session_id);
  revalidatePath(`/seans/${session_id}`);
}

export async function saveConsent(session_id: string, dataUrl: string, signer_name: string, consent_text: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
  const path = `${session_id}.png`;
  const { error: e1 } = await sb.storage.from("consents").upload(path, bytes, { contentType: "image/png", upsert: true });
  if (e1) throw e1;
  const { error } = await sb.from("consents").upsert({ session_id, signature_path: path, signer_name, consent_text, nurse_id: user?.id });
  if (error) throw error;
  revalidatePath(`/seans/${session_id}`);
}

// ---------- STOK ----------
export async function createPurchase(fd: FormData) {
  const sb = await createClient();
  const { data: p, error } = await sb.from("purchases").insert({ supplier: s(fd, "supplier"), invoice_no: s(fd, "invoice_no"), invoice_date: s(fd, "invoice_date") ?? undefined, total: n(fd, "total"), notes: s(fd, "notes") }).select("id").single();
  if (error) throw error;
  const ids = fd.getAll("product_id[]"), qs = fd.getAll("quantity[]"), ps = fd.getAll("unit_price[]");
  const items = ids.map((pid, i) => ({ purchase_id: p.id, product_id: String(pid), quantity: Number(qs[i]), unit_price: ps[i] ? Number(ps[i]) : null })).filter(i => i.product_id && i.quantity > 0);
  if (items.length) { const { error: e2 } = await sb.from("purchase_items").insert(items); if (e2) throw e2; }
  revalidatePath("/stok"); redirect("/stok");
}

export async function saveProduct(fd: FormData) {
  const sb = await createClient();
  const id = s(fd, "id");
  const row = { name: s(fd, "name"), category: s(fd, "category"), min_stock: n(fd, "min_stock") ?? 0, is_active: fd.get("is_active") !== "off" };
  const { error } = id ? await sb.from("products").update(row).eq("id", id) : await sb.from("products").insert(row);
  if (error) throw error;
  revalidatePath("/stok"); revalidatePath("/ayarlar");
}

/** Ürünü tamamen sil; stok hareketi/hizmet paketi gibi bağlı kayıt varsa pasife al. */
export async function deleteProduct(id: string) {
  const sb = await createClient();
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) { const { error: e2 } = await sb.from("products").update({ is_active: false }).eq("id", id); if (e2) throw e2; }
  revalidatePath("/stok"); revalidatePath("/ayarlar");
}

// ---------- AYARLAR ----------
export async function saveService(fd: FormData) {
  const sb = await createClient();
  const id = s(fd, "id");
  const row = { name: s(fd, "name"), default_price: n(fd, "default_price") ?? 0 };
  const { error } = id ? await sb.from("services").update(row).eq("id", id) : await sb.from("services").insert(row);
  if (error) throw error;
  revalidatePath("/ayarlar");
}

export async function saveKitItem(fd: FormData) {
  const sb = await createClient();
  const { error } = await sb.from("service_kits").upsert({ service_id: s(fd, "service_id"), product_id: s(fd, "product_id"), quantity: n(fd, "quantity") });
  if (error) throw error;
  revalidatePath("/ayarlar");
}
export async function deleteKitItem(service_id: string, product_id: string) {
  const sb = await createClient();
  await sb.from("service_kits").delete().match({ service_id, product_id });
  revalidatePath("/ayarlar");
}

export async function saveDoctor(fd: FormData) {
  const sb = await createClient();
  const id = s(fd, "id");
  const row = { full_name: s(fd, "full_name"), specialty: s(fd, "specialty"), phone: s(fd, "phone"), profile_id: s(fd, "profile_id") };
  const { error } = id ? await sb.from("doctors").update(row).eq("id", id) : await sb.from("doctors").insert(row);
  if (error) throw error;
  revalidatePath("/ayarlar");
}

export async function updateProfileRole(fd: FormData) {
  const sb = await createClient();
  const { error } = await sb.from("profiles").update({ role: s(fd, "role"), full_name: s(fd, "full_name"), is_active: fd.get("is_active") === "on" }).eq("id", s(fd, "id"));
  if (error) throw error;
  revalidatePath("/ayarlar");
}
