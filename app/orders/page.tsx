import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge, Empty, Table } from "@/components/admin/ui";
import { td, th } from "@/components/seller/styles";
import { createClient } from "@/lib/supabase/server";
import { date, money } from "@/lib/format";

export const metadata = { title: "My orders | CODM Accounts" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/orders");

  await supabase.rpc("expire_stale_orders"); // release reservations that were never paid
  const { data, error } = await supabase.from("orders").select("id,listing_title,total_cents,status,created_at")
    .eq("buyer_id", user.id).order("created_at", { ascending: false });
  const orders = data ?? [];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-3xl font-bold tracking-tight">My orders</h1>
        <p className="mt-1 text-sm text-mute">Accounts you have bought. Selling instead? See the <Link href="/sell" className="underline underline-offset-4">Seller centre</Link>.</p>
        {params.paid && <p role="status" className="mt-6 border-l-2 border-olive pl-3 text-sm">Payment received. Open the order to message the seller and get your account.</p>}
        {error && <p role="alert" className="mt-6 border-l-2 border-alert pl-3 text-sm text-alert">Could not load your orders: {error.message}</p>}
        <div className="mt-6">
          {orders.length === 0 ? (
            <Empty>No orders yet. <Link href="/accounts" className="underline underline-offset-4">Browse accounts</Link> to find one.</Empty>
          ) : (
            <Table min="44rem">
              <thead><tr><th className={th}>Order</th><th className={th}>Account</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}>Placed</th><th className={th}></th></tr></thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className={`${td} font-medium`}>{o.id}</td><td className={td}>{o.listing_title}</td>
                    <td className={td}>{money(o.total_cents)}</td><td className={td}><Badge s={o.status} /></td>
                    <td className={`${td} text-mute`}>{date(o.created_at)}</td>
                    <td className={td}>
                      <Link href={o.status === "awaiting_payment" ? `/checkout/pay?orders=${o.id}` : `/orders/${o.id}`} className="text-olive underline underline-offset-4">
                        {o.status === "awaiting_payment" ? "Pay" : "Open"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
