import { validSignature } from "@/lib/paystack";
import { settleReference } from "@/lib/paystack-settle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Set this URL in the Paystack dashboard (Settings > API Keys & Webhooks): https://YOUR-SITE/api/paystack/webhook
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-paystack-signature"))) return new Response("Invalid signature", { status: 401 });

  let event: { event?: string; data?: { reference?: unknown } };
  try { event = JSON.parse(raw); } catch { return new Response("Bad request", { status: 400 }); }

  if (event.event === "charge.success" && typeof event.data?.reference === "string") {
    try {
      await settleReference(event.data.reference);
    } catch (e) {
      console.error("Paystack webhook failed:", e);
      return new Response("Try again", { status: 500 }); // Paystack retries automatically
    }
  }
  return new Response("ok", { status: 200 });
}
