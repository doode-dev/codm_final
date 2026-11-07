"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { Badge, Empty, PageHeader, ReasonDialog, Tabs, btnDanger, btnPrimary } from "@/components/admin/ui";
import { date, money } from "@/lib/format";

export default function DisputesAdmin() {
  const { disputes, orders, nameOf, resolveDispute } = useAdmin();
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [dlg, setDlg] = useState<{ id: string; outcome: "buyer" | "seller" } | null>(null);
  const rows = disputes.filter((d) => (tab === "open") === (d.status === "open"));

  return (
    <>
      <PageHeader title="Disputes" sub="Decide who gets the money when a buyer says the account was not as listed." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "open", label: "Open", count: disputes.filter((d) => d.status === "open").length },
        { id: "resolved", label: "Resolved", count: disputes.filter((d) => d.status !== "open").length }]} />
      {rows.length === 0 ? <Empty>No disputes here.</Empty> : (
        <ul className="space-y-4">
          {rows.map((d) => {
            const o = orders.find((x) => x.id === d.orderId);
            return (
              <li key={d.id} className="border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold">{d.id}, order {d.orderId}</p>
                  <Badge s={d.status} />
                </div>
                {o && <p className="mt-1 text-sm text-mute">{o.title}, {money(o.total)}. Buyer {nameOf(o.buyerId)}, seller {nameOf(o.sellerId)}.</p>}
                <p className="mt-4 text-sm leading-relaxed"><span className="text-mute">Opened by {nameOf(d.openedBy)} on {date(d.openedAt)}:</span> {d.reason}</p>
                <p className="mt-1 text-xs text-mute">{d.evidence} evidence files attached</p>
                {d.note && <p className="mt-3 border-l-2 border-olive pl-3 text-sm text-mute">Decision: {d.note}</p>}
                {d.status === "open" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className={btnDanger} onClick={() => setDlg({ id: d.id, outcome: "buyer" })}>Refund buyer</button>
                    <button className={btnPrimary} onClick={() => setDlg({ id: d.id, outcome: "seller" })}>Release to seller</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ReasonDialog open={!!dlg} title={dlg?.outcome === "buyer" ? "Refund the buyer" : "Release payment to the seller"} confirmLabel="Confirm decision"
        danger={dlg?.outcome === "buyer"} onClose={() => setDlg(null)}
        body="Both sides see your decision note. This closes the dispute."
        onConfirm={(r) => { if (dlg) resolveDispute(dlg.id, dlg.outcome, r); setDlg(null); }} />
    </>
  );
}
