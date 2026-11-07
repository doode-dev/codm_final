"use server";

import { createClient } from "@/lib/supabase/server";
import { isEmail } from "@/lib/validate";
import type { ActionResult } from "@/lib/listing-input";

export async function submitTicket(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (String(formData.get("website") ?? "") !== "") return { ok: true }; // hidden field: only bots fill it in

  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const order = String(formData.get("order_id") ?? "").trim();
  if (!isEmail(email)) return { error: "Enter a valid email address so we can reply." };
  if (subject.length < 3 || subject.length > 120) return { error: "Give your message a short subject (3 to 120 characters)." };
  if (message.length < 10 || message.length > 4000) return { error: "Write your message in 10 to 4000 characters." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("support_tickets").insert({ user_id: user?.id ?? null, email, subject, message, order_id: order || null });
  if (error) { console.error("support ticket failed:", error.message); return { error: "Could not send your message. Please try again." }; }
  return { ok: true };
}
