"use client";

import { useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { Badge, Empty, PageHeader, ReasonDialog, Search, Table, Tabs, btn, btnDanger, btnPrimary, td, th } from "@/components/admin/ui";
import type { OrderStatus } from "@/data/admin";
import { date, money } from "@/lib/format";

type Tab = "all" | OrderStatus;

export default function OrdersAdmin() {
  const { orders, nameOf, setOrderStatus, refundOrder } = useAdmin();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [refundId, setRefundId] = useState<string | null>(null);

  const rows = useMemo(() => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter((o) =>
    (tab === "all" || o.status === tab) &&
    (!q || `${o.id} ${o.title} ${o.paymentRef} ${nameOf(o.buyerId)} ${nameOf(o.sellerId)}`.toLowerCase().includes(q.toLowerCase()))), [orders, tab, q, nameOf]);
  const n = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const volume = rows.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <PageHeader title="Orders" sub="Every purchase on the marketplace, with the buyer, seller and payment reference." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "all", label: "All", count: orders.length }, { id: "paid", label: "Paid", count: n("paid") },
        { id: "under_review", label: "Under review", count: n("under_review") }, { id: "completed", label: "Completed", count: n("completed") },
        { id: "disputed", label: "Disputed", count: n("disputed") }, { id: "refunded", label: "Refunded", count: n("refunded") },
        { id: "awaiting_payment", label: "Awaiting payment", count: n("awaiting_payment") }, { id: "payment_failed", label: "Failed", count: n("payment_failed") }]} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Search value={q} onChange={setQ} placeholder="Search by order, listing, user or payment ref" />
        <p className="text-sm text-mute">{rows.length} orders, {money(volume)} total</p>
      </div>
      {rows.length === 0 ? <Empty>No orders in this view.</Empty> : (
        <Table min="70rem">
          <thead><tr><th className={th}>Order</th><th className={th}>Listing</th><th className={th}>Buyer</th><th className={th}>Seller</th>
            <th className={th}>Total</th><th className={th}>Fees to us</th><th className={th}>Status</th><th className={th}>Date</th><th className={th}>Actions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((o) => (
              <tr key={o.id}>
                <td className={td}><p className="font-medium">{o.id}</p><p className="text-xs text-mute">{o.paymentRef}</p></td>
                <td className={`${td} max-w-60`}><p>{o.title}</p><p className="text-xs text-mute">{o.listingId}</p></td>
                <td className={td}>{nameOf(o.buyerId)}</td><td className={td}>{nameOf(o.sellerId)}</td>
                <td className={td}>{money(o.total)}</td><td className={td}>{money(o.buyerFee + o.commission)}</td>
                <td className={td}><Badge s={o.status} /></td>
                <td className={`${td} text-mute`}>{date(o.createdAt)}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1.5">
                    {o.status === "paid" && <button className={btn} onClick={() => setOrderStatus(o.id, "under_review", "Held for review")}>Hold for review</button>}
                    {(o.status === "paid" || o.status === "under_review") && <button className={btnPrimary} onClick={() => setOrderStatus(o.id, "completed", "Marked completed")}>Complete</button>}
                    {["paid", "under_review", "completed"].includes(o.status) && <button className={btnDanger} onClick={() => setRefundId(o.id)}>Refund</button>}
                    {o.status === "awaiting_payment" && <><button className={btnPrimary} onClick={() => setOrderStatus(o.id, "paid", "Payment confirmed by admin")}>Mark paid</button>
                      <button className={btn} onClick={() => setOrderStatus(o.id, "cancelled", "Cancelled by admin")}>Cancel</button></>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ReasonDialog open={!!refundId} danger title="Refund order" confirmLabel="Refund buyer" onClose={() => setRefundId(null)}
        body="The buyer is refunded in full. If the order was paid through Paystack, the money goes back automatically. Test and manual payments must be refunded by hand."
        onConfirm={(r) => { if (refundId) refundOrder(refundId, r); setRefundId(null); }} />
    </>
  );
}
