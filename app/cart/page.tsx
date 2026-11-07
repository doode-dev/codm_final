import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartView from "@/components/shop/CartView";
import { getCart } from "@/lib/cart";

export const metadata = { title: "Your cart | CODM Accounts" };

export default async function CartPage() {
  const cart = await getCart();
  if (!cart) redirect("/auth/login?next=/cart");
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">Your cart</h1>
        <CartView {...cart} />
      </main>
      <Footer />
    </>
  );
}
