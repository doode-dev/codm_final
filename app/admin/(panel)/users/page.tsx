"use client";

import { useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { Badge, Empty, PageHeader, ReasonDialog, Search, Table, Tabs, btn, btnDanger, btnPrimary, td, th } from "@/components/admin/ui";
import { date } from "@/lib/format";

type Tab = "all" | "buyers" | "sellers" | "queue" | "banned";

export default function UsersAdmin() {
  const { users, listings, banUser, unbanUser, setVerification } = useAdmin();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [banId, setBanId] = useState<string | null>(null);

  const isSeller = (r: string) => r === "seller" || r === "both";
  const rows = useMemo(() => users.filter((u) =>
    (tab === "all" || (tab === "buyers" && u.role !== "seller") || (tab === "sellers" && isSeller(u.role)) ||
     (tab === "queue" && u.sellerVerification === "pending") || (tab === "banned" && u.status === "banned")) &&
    (!q || `${u.username} ${u.email} ${u.id}`.toLowerCase().includes(q.toLowerCase()))), [users, tab, q]);
  const target = users.find((u) => u.id === banId);
  const live = (id: string) => listings.filter((l) => l.sellerId === id && ["active", "pending_review", "reserved"].includes(l.status)).length;

  return (
    <>
      <PageHeader title="Users and sellers" sub="Ban or restore accounts and verify sellers. Banning a seller also suspends their live listings." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "all", label: "Everyone", count: users.length }, { id: "buyers", label: "Buyers" }, { id: "sellers", label: "Sellers" },
        { id: "queue", label: "Verification queue", count: users.filter((u) => u.sellerVerification === "pending").length },
        { id: "banned", label: "Banned", count: users.filter((u) => u.status === "banned").length }]} />
      <div className="mb-4"><Search value={q} onChange={setQ} placeholder="Search by name, email or ID" /></div>
      {rows.length === 0 ? <Empty>No users in this view.</Empty> : (
        <Table min="62rem">
          <thead><tr><th className={th}>User</th><th className={th}>Role</th><th className={th}>Status</th><th className={th}>Seller check</th>
            <th className={th}>Orders</th><th className={th}>Sales</th><th className={th}>Reports</th><th className={th}>Joined</th><th className={th}>Actions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className={td}><p className="font-medium">{u.username}</p>
                  <p className="text-xs text-mute">{u.email}, {u.country}{!u.emailVerified && ", email not verified"}{u.phone ? `, ${u.phone} ${u.phoneVerified ? "(verified)" : "(not verified)"}` : ""}</p></td>
                <td className={td}>{u.role === "both" ? "Buyer and seller" : u.role[0].toUpperCase() + u.role.slice(1)}</td>
                <td className={td}><Badge s={u.status} /></td>
                <td className={td}>{isSeller(u.role) ? <Badge s={u.sellerVerification} /> : <span className="text-mute">Not a seller</span>}</td>
                <td className={td}>{u.orders}</td><td className={td}>{u.sales}</td>
                <td className={`${td} ${u.reports ? "text-alert" : "text-mute"}`}>{u.reports}</td>
                <td className={`${td} text-mute`}>{date(u.joinedAt)}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1.5">
                    {u.sellerVerification === "pending" && u.status === "active" && <>
                      <button className={btnPrimary} onClick={() => setVerification(u.id, "verified")}>Verify</button>
                      <button className={btn} onClick={() => setVerification(u.id, "rejected")}>Reject</button></>}
                    {u.role === "admin" ? <span className="text-xs text-mute">Admin</span> : u.status === "active" ? <button className={btnDanger} onClick={() => setBanId(u.id)}>Ban</button>
                      : <button className={btn} onClick={() => unbanUser(u.id)}>Unban</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ReasonDialog open={!!target} danger title={`Ban ${target?.username ?? ""}`} confirmLabel="Ban user" onClose={() => setBanId(null)}
        body={target && isSeller(target.role) && live(target.id) ? `They lose access to the site and ${live(target.id)} live listing(s) will be suspended.` : "They lose access to the site. You can unban them later."}
        onConfirm={(r) => { if (banId) banUser(banId, r); setBanId(null); }} />
    </>
  );
}
