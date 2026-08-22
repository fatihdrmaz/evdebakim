"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const s = (fd: FormData, k: string) => { const v = fd.get(k); return v === null || v === "" ? null : String(v); };
const n = (fd: FormData, k: string) => { const v = s(fd, k); return v === null ? null : Number(v.replace(",", ".")); };

export async function savePatient(fd: FormData) {
  const sb = await createClient();
  const id = s(fd, "id");
  const row = {
    first_name: s(fd, "first_name"), last_name: s(fd, "last_name"), phone: s(fd, "phone"),
    nationality: s(fd, "nationality"), tc_no: s(fd, "tc_no"), passport_no: s(fd, "passport_no"),
    birth_date: s(fd, "birth_date"), gender: s(fd, "gender"), address: s(fd, "address"), doctor_id: s(fd, "doctor_id"), notes: s(fd, "notes"),
    updated_at: new Date().toISOString(),
  };
  let pid = id;
  if (id) { const { error } = await sb.from("patients").update(row).eq("id", id); if (error) throw error; }
  else { const { data, error } = await sb.from("patients").insert(row).select("id").single(); if (error) throw error; pid = data.id; }
  revalidatePath("/hastalar"); redirect(`/hastalar/${pid}`);
}

export async function saveAnamnesis(fd: FormData) {
  const sb = await createClient();
  const patient_id = s(fd, "patient_id")!;
  const { error } = await sb.from("anamnesis").upsert({
    patient_id, height_cm: n(fd, "height_cm"), weight_kg: n(fd, "weight_kg"),
    chronic_diseases: s(fd, "chronic_diseases"), surgeries: s(fd, "surgeries"), allergies: s(fd, "allergies"),
    medications: s(fd, "medications"), clinical_history: s(fd, "clinical_history"), special_conditions: s(fd, "special_conditions"),
    smoking: fd.get("smoking") === "on", alcohol: fd.get("alcohol") === "on", pregnancy: fd.get("pregnancy") === "on",
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  redirect(`/hastalar/${patient_id}`);
}

export async function createSale(fd: FormData) {
  const sb = await createClient();
  const patient_id = s(fd, "patient_id")!;
  const { error } = await sb.from("sales").insert({
    patient_id, service_id: s(fd, "service_id"), session_count: n(fd, "session_count"), unit_price: n(fd, "unit_price"), payer: s(fd, "payer"), notes: s(fd, "notes"),
  });
  if (error) throw error;
  redirect(`/hastalar/${patient_id}`);
}

export async function addPayment(fd: FormData) {
  const sb = await createClient();
  const { error } = await sb.from("payments").insert({ sale_id: s(fd, "sale_id"), amount: n(fd, "amount"), method: s(fd, "method"), paid_at: s(fd, "paid_at") ?? undefined, notes: s(fd, "notes") });
  if (error) throw error;
  revalidatePath(`/hastalar/${s(fd, "patient_id")}`);
}

export async function scheduleSession(fd: FormData) {
  const sb = await createClient();
  const id = s(fd, "id")!;
  const { error } = await sb.from("sessions").update({ scheduled_at: s(fd, "scheduled_at") ? new Date(s(fd, "scheduled_at")!).toISOString() : null, nurse_id: s(fd, "nurse_id") }).eq("id", id);
  if (error) throw error;
  revalidatePath("/takvim"); revalidatePath("/"); revalidatePath(`/seans/${id}`);
}

export async function setSessionStatus(id: string, status: string, patient_id?: string) {
  const sb = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "tamamlandi") patch.completed_at = new Date().toISOString();
  const { error } = await sb.from("sessions").update(patch).eq("id", id);
  if (error) throw error;
  revalidatePath(`/seans/${id}`); revalidatePath("/takvim"); revalidatePath("/"); if (patient_id) revalidatePath(`/hastalar/${patient_id}`);
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
