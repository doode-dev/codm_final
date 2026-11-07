import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { settleReference, type Settled } from "@/lib/paystack-settle";

export const metadata = { title: "Payment | CODM Accounts" };
export const dynamic = "force-dynamic";

export default async function PaystackCallback({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string }> }) {
  const { reference, trxref } = await searchParams;
  const ref = reference ?? trxref;
  if (!ref) redirect("/orders");

  let result: Settled | "error" = "error";
  try { result = await settleReference(ref); } catch (e) { console.error("Paystack callback failed:", e); }
  if (result === "success") redirect("/orders?paid=1");

  const msg: Record<string, [string, string]> = {
    needs_review: ["We received your payment and are checking it", "Something about this payment needs a person to look at it (for example the order expired while you paid). Our team will contact you. You will not lose your money."],
    pending: ["Your payment is not complete", "Paystack has not confirmed a successful payment. If you were charged, wait a few minutes and open your orders. Otherwise you can try again."],
    unknown: ["We couldn't find that payment", "Open your orders to see where things stand, or contact support."],
    error: ["We couldn't confirm your payment yet", "This can happen for a moment after paying. Open your orders in a few minutes. If you were charged and nothing changes, contact support."],
  };
  const [title, body] = msg[result];
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-mute">{body}</p>
        <div className="mt-6 flex gap-3 text-sm">
          <Link href="/orders" className="rounded-sm bg-olive px-4 py-2 font-medium text-white hover:bg-olive-dark">My orders</Link>
          <Link href="/contact" className="rounded-sm border border-line px-4 py-2 hover:border-ink">Contact support</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
