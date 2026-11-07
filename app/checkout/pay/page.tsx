import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PayPanel from "@/components/shop/PayPanel";
import { createClient } from "@/lib/supabase/server";
import { dateTime, money } from "@/lib/format";
import { payMode, paymentInstructions } from "@/lib/payments";
import { formatMinor, fxRate, paystackCurrency, toMinor } from "@/lib/paystack";

export const metadata = { title: "Payment | CODM Accounts" };

export default async function PayPage({ searchParams }: { searchParams: Promise<{ orders?: string }> }) {
  const { orders: raw } = await searchParams;
  const ids = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10);
  if (!ids.length) redirect("/orders");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/checkout/pay?orders=${ids.join(",")}`)}`);

  const [o, s] = await Promise.all([
    supabase.from("orders").select("id,listing_title,total_cents,status,created_at").in("id", ids).eq("buyer_id", user.id),
    supabase.from("site_settings").select("value").eq("key", "reservation_minutes").maybeSingle(),
  ]);
  const orders = (o.data ?? []).filter((x) => x.status === "awaiting_payment");
  if (!orders.length) redirect("/orders");

  const minutes = Number(s.data?.value ?? 60);
  const first = Math.min(...orders.map((x) => new Date(x.created_at).getTime()));
  const total = orders.reduce((n, x) => n + x.total_cents, 0);
  const mode = payMode();
  let charge = money(total);
  if (mode === "paystack") {
    try {
      const rate = fxRate();
      charge = formatMinor(orders.reduce((n, x) => n + toMinor(x.total_cents, rate), 0), paystackCurrency());
    } catch { /* misconfigured: the pay button will explain */ }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Payment</h1>
        <p className="mt-2 text-sm text-mute">Your order is placed. One more step.</p>
        <ul className="mt-6 divide-y divide-line border border-line bg-surface">
          {orders.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-4 p-4 text-sm">
              <div><p className="font-medium">{x.listing_title}</p><p className="text-xs text-mute">{x.id}</p></div>
              <span className="font-bold">{money(x.total_cents)}</span>
            </li>
          ))}
          <li className="flex justify-between p-4 text-base font-bold"><span>Total to pay</span><span>{money(total)}</span></li>
        </ul>
        <div className="mt-6">
          <PayPanel ids={orders.map((x) => x.id)} total={money(total)} charge={charge} mode={mode} instructions={paymentInstructions()}
            expires={dateTime(new Date(first + minutes * 60_000).toISOString())} />
        </div>
        <Link href="/orders" className="mt-8 inline-block text-sm text-mute underline underline-offset-4 hover:text-ink">Pay later from my orders</Link>
      </main>
      <Footer />
    </>
  );
}
