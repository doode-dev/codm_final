"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/listing-input";

export async function placeOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/checkout");

  if (formData.get("terms") !== "on" || formData.get("risk") !== "on") return { error: "Please accept the terms and the risk notice to continue." };

  const { data: items } = await supabase.from("cart_items").select("listing_id").eq("user_id", user.id);
  const ids = (items ?? []).map((i) => i.listing_id);
  if (!ids.length) redirect("/cart");

  // One database transaction: checks every account is still available, creates the orders and reserves the accounts.
  const { data, error } = await supabase.rpc("checkout_cart", { p_listing_ids: ids });
  if (error) return { error: error.message };

  revalidatePath("/cart");
  redirect(`/checkout/pay?orders=${(data as string[]).join(",")}`);
}
