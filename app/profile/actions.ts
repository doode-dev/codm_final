"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { countries } from "@/data/site";
import type { ActionResult } from "@/lib/listing-input";

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/profile");

  const username = String(formData.get("username") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) return { error: "Use 3 to 24 letters, numbers or underscores for your username." };
  if (!countries.includes(country)) return { error: "Choose your country." };

  const { data, error } = await supabase.from("profiles").update({ username, country }).eq("id", user.id).select("id");
  if (error?.code === "23505") return { error: "That username is taken. Try another." };
  if (error || !data?.length) return { error: "Could not save your changes. Please try again." };
  revalidatePath("/profile");
  return { ok: true };
}
