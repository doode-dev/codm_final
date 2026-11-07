"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { refundTransaction, toMinor } from "@/lib/paystack";

// Refunds an order. If it was paid through Paystack, the money goes back to the buyer through Paystack too.
export async function refundOrder(orderId: string, reason: string): Promise<{ ok?: true; error?: string; note?: string }> {
  const { user } = await requireAdmin(); // signed in, admin, and two-factor passed
  if (reason.trim().length < 5) return { error: "Give a reason of at least 5 characters." };

  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id,status,total_cents").eq("id", orderId).maybeSingle();
  if (!order) return { error: "Order not found." };
  if (!["paid", "under_review", "completed", "disputed", "refund_pending"].includes(order.status)) {
    return { error: "This order can't be refunded in its current state." };
  }

  const { data: pay } = await admin.from("payments").select("reference,fx_rate").contains("order_ids", [orderId]).eq("status", "success").maybeSingle();
  let note = "No online payment is recorded for this order, so refund the buyer by hand.";
  if (pay) {
    try {
      await refundTransaction(pay.reference, toMinor(order.total_cents, Number(pay.fx_rate)));
      note = "Paystack refund started.";
    } catch (e) {
      return { error: "Paystack did not accept the refund: " + (e instanceof Error ? e.message : "unknown error") };
    }
  }
  const { error } = await admin.from("orders").update({ status: "refunded" }).eq("id", orderId);
  if (error) return { error: error.message };
  await admin.from("audit_logs").insert({ actor_id: user.id, action: "Order refunded", target: orderId, note: `${reason.trim()}. ${note}` });
  return { ok: true, note };
}
