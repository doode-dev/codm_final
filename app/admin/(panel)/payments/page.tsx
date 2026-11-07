"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { Badge, Empty, PageHeader, ReasonDialog, Table, Tabs, btnPrimary, td, th } from "@/components/admin/ui";
import { dateTime } from "@/lib/format";

const fmt = (minor: number, currency: string) => new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100);

export default function PaymentsAdmin() {
  const { payments, nameOf, resolvePayment } = useAdmin();
  const [tab, setTab] = useState<"review" | "all">("review");
  const [ref, setRef] = useState<string | null>(null);
  const rows = payments.filter((p) => tab === "all" || p.status === "needs_review");

  return (
    <>
      <PageHeader title="Payments" sub="Every Paystack payment. Payments that need a person to look at them are listed first." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "review", label: "Needs review", count: payments.filter((p) => p.status === "needs_review").length },
        { id: "all", label: "All payments", count: payments.length }]} />
      {rows.length === 0 ? <Empty>{tab === "review" ? "Nothing needs review. Payments that don't match an order, or arrive after it expired, show up here." : "No payments yet."}</Empty> : (
        <Table min="62rem">
          <thead><tr><th className={th}>Reference</th><th className={th}>Buyer</th><th className={th}>Orders</th><th className={th}>Amount</th><th className={th}>Status</th><th className={th}>Created</th><th className={th}>Actions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.reference}>
                <td className={td}><p className="font-medium">{p.reference}</p>{p.note && <p className="mt-1 max-w-xs text-xs text-alert">{p.note}</p>}</td>
                <td className={td}>{nameOf(p.userId)}</td><td className={td}>{p.orderIds.join(", ")}</td>
                <td className={td}>{fmt(p.amount, p.currency)}</td><td className={td}><Badge s={p.status} /></td>
                <td className={`${td} text-mute`}>{dateTime(p.createdAt)}</td>
                <td className={td}>{p.status === "needs_review" && <button className={btnPrimary} onClick={() => setRef(p.reference)}>Mark resolved</button>}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ReasonDialog open={!!ref} title="Mark payment resolved" confirmLabel="Mark resolved" onClose={() => setRef(null)}
        body="Do this after you have refunded the buyer in Paystack or fixed the order. Say what you did."
        onConfirm={(r) => { if (ref) resolvePayment(ref, r); setRef(null); }} />
    </>
  );
}
