"use client";

import Link from "next/link";
import { useAdmin } from "@/components/admin/store";
import { Badge, PageHeader, Table, td, th } from "@/components/admin/ui";
import { dateTime, money } from "@/lib/format";

export default function Overview() {
  const { orders, listings, disputes, reports, payouts, payments, audit, users, nameOf } = useAdmin();
  const done = orders.filter((o) => o.status === "completed");
  const stats: [string, string][] = [
    ["Completed sales", money(done.reduce((s, o) => s + o.price, 0))],
    ["Platform revenue", money(done.reduce((s, o) => s + o.buyerFee + o.commission, 0))],
    ["Orders", String(orders.length)],
    ["Active listings", String(listings.filter((l) => l.status === "active").length)],
    ["Users", String(users.length)],
    ["Payouts waiting", money(payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0))],
  ];
  const queue: [string, number, string][] = [
    ["Listings waiting for review", listings.filter((l) => l.status === "pending_review").length, "/admin/listings"],
    ["Open disputes", disputes.filter((d) => d.status === "open").length, "/admin/disputes"],
    ["Open reports", reports.filter((r) => r.status === "open").length, "/admin/reports"],
    ["Sellers waiting for verification", users.filter((u) => u.sellerVerification === "pending").length, "/admin/users"],
    ["Payments needing review", payments.filter((p) => p.status === "needs_review").length, "/admin/payments"],
    ["Payouts to approve", payouts.filter((p) => p.status === "pending").length, "/admin/payouts"],
    ["Orders under review", orders.filter((o) => o.status === "under_review").length, "/admin/orders"],
  ];
  return (
    <>
      <PageHeader title="Overview" sub="What needs you today, and how the marketplace is doing." />
      <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-surface p-4">
            <dd className="text-xl font-bold">{v}</dd><dt className="mt-1 text-xs text-mute">{k}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section>
          <h2 className="mb-3 font-bold">Needs attention</h2>
          <ul className="divide-y divide-line border border-line">
            {queue.map(([label, n, href]) => (
              <li key={label}>
                <Link href={href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-surface">
                  <span>{label}</span>
                  <span className={n > 0 ? "font-bold text-olive" : "text-mute"}>{n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <div className="mb-3 flex items-baseline justify-between"><h2 className="font-bold">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm text-mute underline underline-offset-4">All orders</Link></div>
          <Table min="30rem">
            <thead><tr><th className={th}>Order</th><th className={th}>Buyer</th><th className={th}>Total</th><th className={th}>Status</th></tr></thead>
            <tbody className="divide-y divide-line">
              {[...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((o) => (
                <tr key={o.id}><td className={td}>{o.id}</td><td className={td}>{nameOf(o.buyerId)}</td><td className={td}>{money(o.total)}</td><td className={td}><Badge s={o.status} /></td></tr>
              ))}
            </tbody>
          </Table>
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between"><h2 className="font-bold">Recent admin activity</h2>
          <Link href="/admin/audit-log" className="text-sm text-mute underline underline-offset-4">Full log</Link></div>
        <ul className="divide-y divide-line border border-line text-sm">
          {audit.slice(0, 5).map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
              <span>{a.action}, <span className="text-mute">{a.target}</span></span><span className="text-xs text-mute">{dateTime(a.at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
