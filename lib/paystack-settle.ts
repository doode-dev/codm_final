import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";

export type Settled = "success" | "needs_review" | "pending" | "unknown";

// Asks Paystack whether this payment really succeeded (we never trust the browser or the URL), then lets the database
// check the amount and mark the orders paid. Safe to call many times for the same payment.
export async function settleReference(reference: string): Promise<Settled> {
  const tx = await verifyTransaction(reference);
  if (tx.status !== "success") return "pending";
  const { data, error } = await createAdminClient().rpc("settle_payment", {
    p_reference: reference, p_amount: tx.amount, p_currency: tx.currency, p_gateway_id: String(tx.id),
  });
  if (error) throw new Error(error.message);
  if (data === "unknown_reference") return "unknown";
  return data === "success" ? "success" : "needs_review";
}
