"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { normalizePhone } from "@/lib/phone";
import type { ActionResult } from "@/lib/listing-input";

async function me() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/sell");
  return { supabase, user };
}

export async function createSellerProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await me();
  const username = String(formData.get("username") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const bio = String(formData.get("bio") ?? "").trim();

  if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) return { error: "Choose a seller name of 3 to 24 letters, numbers or underscores." };
  if (!phone) return { error: "Enter your phone number with the country code, for example +233 24 000 0000." };
  if (bio.length > 280) return { error: "Keep your bio under 280 characters." };

  const { error } = await supabase.rpc("become_seller", { p_username: username, p_phone: phone, p_bio: bio });
  if (error) {
    if (error.code === "23505") return { error: "That seller name is already taken. Try another." };
    if (/already have a seller profile/i.test(error.message)) redirect("/sell");
    if (/Admin accounts/i.test(error.message)) return { error: error.message };
    console.error("become_seller failed:", error.message);
    return { error: "Could not create your seller profile. Please try again." };
  }
  revalidatePath("/sell");
  redirect("/sell");
}

export async function updateSellerProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await me();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const bio = String(formData.get("bio") ?? "").trim();
  if (!phone) return { error: "Enter your phone number with the country code." };
  if (bio.length > 280) return { error: "Keep your bio under 280 characters." };

  const { data, error } = await supabase.from("sellers").update({ phone, bio }).eq("id", user.id).select("id");
  if (error || !data?.length) return { error: "Could not save your details. Please try again." };
  revalidatePath("/sell");
  return { ok: true };
}

// Called before a verification code is sent, so the saved number is the one being verified.
export async function setSellerPhone(raw: string): Promise<ActionResult> {
  const { supabase, user } = await me();
  const phone = normalizePhone(raw);
  if (!phone) return { error: "Enter the number with the country code, like +233 24 000 0000." };
  const { data, error } = await supabase.from("sellers").update({ phone }).eq("id", user.id).select("id");
  if (error || !data?.length) return { error: "Could not save that number. Please try again." };
  return { ok: true };
}
