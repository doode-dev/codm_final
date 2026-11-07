"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/listing-input";

async function me() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/orders");
  return { supabase, user };
}
const done = (id: string): ActionResult => { revalidatePath(`/orders/${id}`); revalidatePath("/orders"); revalidatePath("/"); return { ok: true }; };

export async function cancelOrder(id: string): Promise<ActionResult> {
  const { supabase } = await me();
  const { error } = await supabase.rpc("cancel_order", { p_order: id });
  return error ? { error: error.message } : done(id);
}

export async function confirmOrder(id: string): Promise<ActionResult> {
  const { supabase } = await me();
  const { error } = await supabase.rpc("confirm_order", { p_order: id });
  return error ? { error: error.message } : done(id);
}

export async function openDispute(id: string, reason: string): Promise<ActionResult> {
  const { supabase } = await me();
  const { error } = await supabase.rpc("open_dispute", { p_order: id, p_reason: reason });
  return error ? { error: error.message } : done(id);
}

export async function sendMessage(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await me();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a message first." };
  if (body.length > 2000) return { error: "Keep messages under 2000 characters." };
  const { error } = await supabase.from("order_messages").insert({ order_id: id, sender_id: user.id, body });
  if (error) return { error: error.code === "42501" ? "You can't message on this order right now." : "Could not send your message. Please try again." };
  return done(id);
}
