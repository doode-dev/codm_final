"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { Badge, Empty, PageHeader, ReasonDialog, Table, Tabs, btn, btnDanger, td, th } from "@/components/admin/ui";
import { date } from "@/lib/format";

export default function ReportsAdmin() {
  const { reports, listings, users, nameOf, resolveReport, setListingStatus, banUser } = useAdmin();
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [dlg, setDlg] = useState<string | null>(null);
  const rows = reports.filter((r) => (tab === "open") === (r.status === "open"));
  const cur = reports.find((r) => r.id === dlg);
  const label = (r: (typeof reports)[number]) => r.targetType === "listing"
    ? listings.find((l) => l.id === r.targetId)?.title ?? r.targetId : users.find((u) => u.id === r.targetId)?.username ?? r.targetId;

  return (
    <>
      <PageHeader title="Reports" sub="Listings and users that other people have reported." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "open", label: "Open", count: reports.filter((r) => r.status === "open").length },
        { id: "closed", label: "Closed", count: reports.filter((r) => r.status !== "open").length }]} />
      {rows.length === 0 ? <Empty>No reports here.</Empty> : (
        <Table min="54rem">
          <thead><tr><th className={th}>Report</th><th className={th}>About</th><th className={th}>Reason</th><th className={th}>Reported by</th>
            <th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={td}><p className="font-medium">{r.id}</p><p className="text-xs text-mute">{date(r.createdAt)}</p></td>
                <td className={`${td} max-w-60`}><p>{label(r)}</p><p className="text-xs text-mute">{r.targetType === "listing" ? "Listing" : "User"} {r.targetId}</p></td>
                <td className={`${td} max-w-72`}>{r.reason}</td>
                <td className={td}>{nameOf(r.reporterId)}</td>
                <td className={td}><Badge s={r.status} /></td>
                <td className={td}>
                  {r.status === "open" && (
                    <div className="flex flex-wrap gap-1.5">
                      <button className={btnDanger} onClick={() => setDlg(r.id)}>{r.targetType === "listing" ? "Suspend listing" : "Ban user"}</button>
                      <button className={btn} onClick={() => resolveReport(r.id, "dismissed", "No violation found")}>Dismiss</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ReasonDialog open={!!cur} danger onClose={() => setDlg(null)}
        title={cur?.targetType === "listing" ? "Suspend reported listing" : "Ban reported user"}
        confirmLabel={cur?.targetType === "listing" ? "Suspend listing" : "Ban user"}
        body="This is applied straight away and the report is marked as actioned."
        onConfirm={(reason) => {
          if (cur) {
            if (cur.targetType === "listing") setListingStatus(cur.targetId, "suspended", reason); else banUser(cur.targetId, reason);
            resolveReport(cur.id, "actioned", reason);
          }
          setDlg(null);
        }} />
    </>
  );
}
