"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { payMode } from "@/lib/payments";
import { fxRate, initializeTransaction, paystackCurrency, toMinor } from "@/lib/paystack";
import type { ActionResult } from "@/lib/listing-input";

async function myOrders(ids: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/orders");
  const { data: orders } = await supabase.from("orders").select("id,status,total_cents").in("id", ids).eq("buyer_id", user.id);
  return { user, orders: orders ?? [] };
}

// Pay with Paystack: record the payment, then send the buyer to Paystack's secure page. The money is only
// counted when the webhook or the callback page confirms it with Paystack (see lib/paystack-settle.ts).
export async function startPaystack(ids: string[]): Promise<ActionResult> {
  if (payMode() !== "paystack") return { error: "Online payment isn't switched on." };
  if (!ids.length || ids.length > 10) return { error: "Order not found." };
  const { user, orders } = await myOrders(ids);
  if (orders.length !== ids.length) return { error: "Order not found." };
  if (orders.some((o) => o.status !== "awaiting_payment")) return { error: "One of these orders is no longer waiting for payment." };
  if (!user.email) return { error: "Your account has no email address." };

  let url: string;
  try {
    const rate = fxRate();
    const currency = paystackCurrency();
    const amount = orders.reduce((n, o) => n + toMinor(o.total_cents, rate), 0);
    const reference = `cm_${crypto.randomUUID().replace(/-/g, "")}`;
    const site = (process.env.SITE_URL ?? "").replace(/\/$/, "");
    if (!site) return { error: "SITE_URL is not set." };

    const { error } = await createAdminClient().from("payments").insert({
      reference, user_id: user.id, order_ids: ids, amount_minor: amount, currency, fx_rate: rate,
    });
    if (error) return { error: "Could not start the payment. Please try again." };

    const tx = await initializeTransaction({
      email: user.email, amount, currency, reference, callback_url: `${site}/checkout/paystack/callback`,
      metadata: { order_ids: ids, user_id: user.id },
    });
    url = tx.authorization_url;
  } catch (e) {
    console.error("startPaystack failed:", e);
    return { error: "We couldn't reach Paystack. Please try again in a moment." };
  }
  redirect(url);
}

// Test mode only (development). In production payMode() never returns "test", so this refuses.
export async function payOrders(ids: string[]): Promise<ActionResult> {
  if (payMode() !== "test") return { error: "Test payment is switched off." };
  const { orders } = await myOrders(ids);
  if (!orders.length || orders.length !== ids.length) return { error: "Order not found." };
  if (orders.some((o) => o.status !== "awaiting_payment")) return { error: "One of these orders is no longer waiting for payment." };
  try {
    const admin = createAdminClient();
    for (const o of orders) {
      const { error } = await admin.rpc("set_order_paid", { p_order: o.id, p_ref: `test_${Date.now()}` });
      if (error) return { error: error.message };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Payment failed." };
  }
  revalidatePath("/orders");
  redirect("/orders?paid=1");
}
