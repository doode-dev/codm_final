import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CheckoutForm from "@/components/shop/CheckoutForm";
import { getCart } from "@/lib/cart";
import { money } from "@/lib/format";

export const metadata = { title: "Checkout | CODM Accounts" };

export default async function CheckoutPage() {
  const cart = await getCart();
  if (!cart) redirect("/auth/login?next=/checkout");
  if (cart.items.length === 0) redirect("/cart");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">Checkout</h1>
        {cart.hasUnavailable ? (
          <p className="border-l-2 border-alert pl-3 text-sm text-alert">
            Some accounts in your cart are no longer available. <Link href="/cart" className="underline underline-offset-4">Go back to your cart</Link> and remove them.
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <section>
              <h2 className="mb-3 font-bold">Your accounts</h2>
              <ul className="divide-y divide-line border border-line bg-surface">
                {cart.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                    <div className="min-w-0"><p className="font-medium">{i.title}</p><p className="mt-1 text-xs text-mute">{i.id}, {i.platform}, level {i.level}</p></div>
                    <span className="font-bold">{money(i.price)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-mute">
                After the seller delivers the account you have a few days to check it. Your money is only released to the seller when you confirm, or when we settle a dispute.
              </p>
            </section>
            <aside className="h-fit space-y-5 border border-line bg-surface p-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-mute">Accounts</dt><dd>{money(cart.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-mute">Service fee ({cart.feePct}%)</dt><dd>{money(cart.fee)}</dd></div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd>{money(cart.total)}</dd></div>
              </dl>
              <CheckoutForm total={money(cart.total)} />
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
