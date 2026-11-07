import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderActions from "@/components/orders/OrderActions";
import MessageForm from "@/components/orders/MessageForm";
import { Badge } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { date, dateTime, money } from "@/lib/format";

export const metadata = { title: "Order | CODM Accounts" };

const explain: Record<string, { buyer: string; seller: string }> = {
  awaiting_payment: { buyer: "Waiting for your payment. The account is reserved for you until the time on the payment page.", seller: "Waiting for the buyer to pay. The account is reserved." },
  paid: { buyer: "Payment received. The seller will share the access steps with you in the chat below. When you can sign in and everything matches the listing, confirm.", seller: "Payment received. Share the access steps with the buyer in the chat below. You are paid after they confirm." },
  under_review: { buyer: "Our team is checking this order. You can keep using the chat below.", seller: "Our team is checking this order." },
  completed: { buyer: "Completed. Thank you.", seller: "Completed. Your payout is on its way, after our checks." },
  disputed: { buyer: "A dispute is open. Our team is reading the order and the chat, and the money is held until they decide.", seller: "A dispute is open. Our team is reading the order and the chat, and the payout is on hold." },
  refunded: { buyer: "This order was refunded.", seller: "This order was refunded to the buyer." },
  cancelled: { buyer: "This order was cancelled and the account went back on sale.", seller: "This order was cancelled." },
  payment_failed: { buyer: "The payment failed and the order was cancelled.", seller: "The payment failed and the order was cancelled." },
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/orders/${id}`)}`);

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound(); // also what you get for someone else's order

  const isBuyer = order.buyer_id === user.id;
  const isSeller = order.seller_id === user.id;
  const [m, d, l, s] = await Promise.all([
    supabase.from("order_messages").select("id,sender_id,body,created_at").eq("order_id", id).order("created_at"),
    supabase.from("disputes").select("reason,status,note,opened_at").eq("order_id", id).order("opened_at", { ascending: false }).limit(1),
    supabase.from("listings").select("level,mp_rank,br_rank,platform,region,access,risk").eq("id", order.listing_id).maybeSingle(),
    supabase.from("site_settings").select("value").eq("key", "review_window_days").maybeSingle(),
  ]);
  const messages = m.data ?? [];
  const dispute = d.data?.[0];
  const listing = l.data;
  const days = Number(s.data?.value ?? 3);
  const deadline = new Date(new Date(order.paid_at ?? order.created_at).getTime() + days * 86_400_000);
  const canDispute = isBuyer && ["paid", "under_review", "completed"].includes(order.status) && deadline > new Date() && dispute?.status !== "open";
  const chatOpen = ["paid", "under_review", "completed", "disputed", "refund_pending"].includes(order.status);
  const text = explain[order.status] ?? { buyer: "", seller: "" };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <Link href={isSeller ? "/sell" : "/orders"} className="text-sm text-mute underline underline-offset-4 hover:text-ink">{isSeller ? "Back to Seller centre" : "Back to my orders"}</Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Order {order.id}</h1>
          <Badge s={order.status} />
        </div>
        <p className="mt-1 text-sm text-mute">{order.listing_title}, placed {dateTime(order.created_at)}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-8">
            <section>
              <p className="text-sm leading-relaxed">{isBuyer ? text.buyer : text.seller}</p>
              {dispute && (
                <div className="mt-4 border-l-2 border-alert pl-3 text-sm">
                  <p><span className="text-mute">Dispute opened {date(dispute.opened_at)}:</span> {dispute.reason}</p>
                  {dispute.note && <p className="mt-1 text-mute">Decision: {dispute.note}</p>}
                </div>
              )}
              {isBuyer && <div className="mt-5"><OrderActions id={order.id} status={order.status} canDispute={canDispute} /></div>}
              {isBuyer && ["paid", "under_review"].includes(order.status) && deadline > new Date() && (
                <p className="mt-3 text-xs text-mute">You can report a problem until {dateTime(deadline.toISOString())}.</p>
              )}
            </section>

            <section>
              <h2 className="font-bold">Chat with the {isBuyer ? "seller" : "buyer"}</h2>
              {!chatOpen ? (
                <p className="mt-2 text-sm text-mute">The chat opens once the order is paid.</p>
              ) : (
                <>
                  <p className="mt-2 text-xs leading-relaxed text-mute">
                    Share access steps only here, and only after payment. Never move the conversation to another app. Our team can read this chat if there is a dispute.
                  </p>
                  <ul className="mt-4 space-y-3">
                    {messages.length === 0 && <li className="text-sm text-mute">No messages yet.</li>}
                    {messages.map((x) => {
                      const mine = x.sender_id === user.id;
                      const who = mine ? "You" : x.sender_id === order.buyer_id ? "Buyer" : x.sender_id === order.seller_id ? "Seller" : "Support";
                      return (
                        <li key={x.id} className={`max-w-xl border border-line p-3 text-sm ${mine ? "ml-auto bg-surface" : "bg-black"}`}>
                          <p className="text-xs text-mute">{who}, {dateTime(x.created_at)}</p>
                          <p className="mt-1 whitespace-pre-wrap break-words">{x.body}</p>
                        </li>
                      );
                    })}
                  </ul>
                  {(isBuyer || isSeller) && <MessageForm orderId={order.id} />}
                </>
              )}
            </section>
          </div>

          <aside className="h-fit space-y-5 border border-line bg-surface p-5 text-sm">
            <h2 className="font-bold">Summary</h2>
            <dl className="space-y-2">
              <div className="flex justify-between"><dt className="text-mute">Account price</dt><dd>{money(order.price_cents)}</dd></div>
              {isBuyer ? (
                <>
                  <div className="flex justify-between"><dt className="text-mute">Service fee</dt><dd>{money(order.buyer_fee_cents)}</dd></div>
                  <div className="flex justify-between border-t border-line pt-2 font-bold"><dt>Total</dt><dd>{money(order.total_cents)}</dd></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><dt className="text-mute">Our commission</dt><dd>-{money(order.commission_cents)}</dd></div>
                  <div className="flex justify-between border-t border-line pt-2 font-bold"><dt>You receive</dt><dd>{money(order.price_cents - order.commission_cents)}</dd></div>
                </>
              )}
            </dl>
            {listing && (
              <div className="border-t border-line pt-4">
                <p className="font-medium">As listed</p>
                <p className="mt-1 text-xs leading-relaxed text-mute">
                  {listing.platform}, {listing.region}. Level {listing.level}. Multiplayer {listing.mp_rank}, battle royale {listing.br_rank}.
                  Sign-in: {listing.access?.signInMethod || "not stated"}. Linked to: {listing.access?.recoveryDependencies || "not stated"}.
                </p>
              </div>
            )}
            <p className="text-xs text-mute">{order.payment_ref ? `Payment reference: ${order.payment_ref}` : "Not paid yet"}</p>
            <Link href="/contact" className="block text-xs text-mute underline underline-offset-4 hover:text-ink">Need help? Contact support</Link>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
