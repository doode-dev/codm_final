"use client";

import { useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { Badge, Empty, PageHeader, ReasonDialog, Search, Table, Tabs, btn, btnDanger, btnPrimary, td, th } from "@/components/admin/ui";
import type { ListingStatus } from "@/data/admin";
import { date, money } from "@/lib/format";
import ListingReview from "@/components/admin/ListingReview";

type Tab = "all" | "pending_review" | "active" | "suspended" | "rejected" | "sold" | "removed";
type Kind = "reject" | "suspend" | "remove" | "delete";
const cfg: Record<Kind, { title: string; body: string; label: string; status: ListingStatus }> = {
  reject: { title: "Reject listing", body: "The seller sees this reason and can edit and resubmit.", label: "Reject listing", status: "rejected" },
  suspend: { title: "Suspend listing", body: "The listing is hidden from buyers until you reinstate it.", label: "Suspend listing", status: "suspended" },
  delete: { title: "Delete permanently", body: "This erases the listing for good and cannot be undone. It fails if the listing has orders.", label: "Delete listing", status: "removed" },
  remove: { title: "Remove listing", body: "The listing is taken off the marketplace for good. The record stays for audits.", label: "Remove listing", status: "removed" },
};

export default function ListingsAdmin() {
  const { listings, nameOf, setListingStatus, toggleFeatured, deleteListing } = useAdmin();
  const [tab, setTab] = useState<Tab>("pending_review");
  const [q, setQ] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [dlg, setDlg] = useState<{ kind: Kind; id: string } | null>(null);

  const rows = useMemo(() => listings.filter((l) =>
    (tab === "all" || l.status === tab) &&
    (!q || `${l.id} ${l.title} ${nameOf(l.sellerId)}`.toLowerCase().includes(q.toLowerCase()))), [listings, tab, q, nameOf]);
  const n = (s: ListingStatus) => listings.filter((l) => l.status === s).length;
  const c = dlg ? cfg[dlg.kind] : null;

  return (
    <>
      <PageHeader title="Listings" sub="Approve new listings, and suspend or remove any that break the rules." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "pending_review", label: "Pending review", count: n("pending_review") }, { id: "active", label: "Active", count: n("active") },
        { id: "suspended", label: "Suspended", count: n("suspended") }, { id: "rejected", label: "Rejected", count: n("rejected") },
        { id: "sold", label: "Sold", count: n("sold") }, { id: "removed", label: "Removed", count: n("removed") }, { id: "all", label: "All", count: listings.length }]} />
      <div className="mb-4"><Search value={q} onChange={setQ} placeholder="Search by ID, title or seller" /></div>
      {rows.length === 0 ? <Empty>No listings in this view.</Empty> : (
        <Table>
          <thead><tr><th className={th}>Listing</th><th className={th}>Seller</th><th className={th}>Price</th><th className={th}>Status</th>
            <th className={th}>Reports</th><th className={th}>Listed</th><th className={th}>Actions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((l) => (
              <tr key={l.id}>
                <td className={td}><p className="font-medium">{l.title}</p><p className="text-xs text-mute">{l.id}{l.featured && ", featured"}</p></td>
                <td className={td}>{nameOf(l.sellerId)}</td>
                <td className={td}>{money(l.price)}</td>
                <td className={td}><Badge s={l.status} /></td>
                <td className={`${td} ${l.reports ? "text-alert" : "text-mute"}`}>{l.reports}</td>
                <td className={`${td} text-mute`}>{date(l.createdAt)}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1.5">
                    {l.status === "pending_review" && <>
                      <button className={btnPrimary} onClick={() => setReviewId(l.id)}>Review</button>
                      <button className={btnDanger} onClick={() => setDlg({ kind: "reject", id: l.id })}>Reject</button></>}
                    {l.status === "active" && <>
                      <button className={btn} onClick={() => toggleFeatured(l.id)}>{l.featured ? "Unfeature" : "Feature"}</button>
                      <button className={btn} onClick={() => setDlg({ kind: "suspend", id: l.id })}>Suspend</button>
                      <button className={btnDanger} onClick={() => setDlg({ kind: "remove", id: l.id })}>Remove</button></>}
                    {l.status === "suspended" && <>
                      <button className={btnPrimary} onClick={() => setListingStatus(l.id, "active", "Reinstated")}>Reinstate</button>
                      <button className={btnDanger} onClick={() => setDlg({ kind: "remove", id: l.id })}>Remove</button></>}
                    {["rejected", "removed", "withdrawn", "expired"].includes(l.status) &&
                      <button className={btnDanger} onClick={() => setDlg({ kind: "delete", id: l.id })}>Delete permanently</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ListingReview id={reviewId} onClose={() => setReviewId(null)} onReject={(id) => setDlg({ kind: "reject", id })} />
      <ReasonDialog open={!!dlg} title={c?.title ?? ""} body={c?.body ?? ""} confirmLabel={c?.label ?? ""} danger onClose={() => setDlg(null)}
        onConfirm={(r) => { if (dlg && c) { if (dlg.kind === "delete") deleteListing(dlg.id, r); else setListingStatus(dlg.id, c.status, r); } setDlg(null); }} />
    </>
  );
}
