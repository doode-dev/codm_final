"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { Badge, Empty, PageHeader, ReasonDialog, Table, Tabs, btn, btnPrimary, td, th } from "@/components/admin/ui";
import { date, money } from "@/lib/format";

export default function PayoutsAdmin() {
  const { payouts, users, nameOf, setPayoutStatus } = useAdmin();
  const [tab, setTab] = useState<"pending" | "on_hold" | "paid">("pending");
  const [holdId, setHoldId] = useState<string | null>(null);
  const rows = payouts.filter((p) => p.status === tab);

  return (
    <>
      <PageHeader title="Payouts" sub="Money owed to sellers after a sale. Approve only when the order is settled and the seller is verified." />
      <Tabs value={tab} onChange={setTab} tabs={(["pending", "on_hold", "paid"] as const).map((s) => (
        { id: s, label: s === "on_hold" ? "On hold" : s[0].toUpperCase() + s.slice(1), count: payouts.filter((p) => p.status === s).length }))} />
      {rows.length === 0 ? <Empty>No payouts here.</Empty> : (
        <Table min="50rem">
          <thead><tr><th className={th}>Payout</th><th className={th}>Seller</th><th className={th}>Order</th><th className={th}>Amount</th>
            <th className={th}>Status</th><th className={th}>Requested</th><th className={th}>Actions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => {
              const verified = users.find((u) => u.id === p.sellerId)?.sellerVerification === "verified";
              return (
                <tr key={p.id}>
                  <td className={`${td} font-medium`}>{p.id}</td>
                  <td className={td}>{nameOf(p.sellerId)}{!verified && <p className="text-xs text-alert">Not verified</p>}</td>
                  <td className={td}>{p.orderId}</td><td className={`${td} font-medium`}>{money(p.amount)}</td>
                  <td className={td}><Badge s={p.status} /></td><td className={`${td} text-mute`}>{date(p.requestedAt)}</td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1.5">
                      {p.status === "pending" && <>
                        <button className={btnPrimary} disabled={!verified} title={verified ? "" : "Verify the seller first"} onClick={() => setPayoutStatus(p.id, "paid", "Approved")}>Approve</button>
                        <button className={btn} onClick={() => setHoldId(p.id)}>Hold</button></>}
                      {p.status === "on_hold" && <button className={btn} onClick={() => setPayoutStatus(p.id, "pending", "Hold released")}>Release hold</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <ReasonDialog open={!!holdId} title="Hold payout" confirmLabel="Hold payout" onClose={() => setHoldId(null)}
        body="The seller is not paid until you release the hold."
        onConfirm={(r) => { if (holdId) setPayoutStatus(holdId, "on_hold", r); setHoldId(null); }} />
    </>
  );
}
