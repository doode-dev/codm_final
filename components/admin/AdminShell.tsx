"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAdmin } from "./store";

export default function AdminShell({ children, adminName }: { children: React.ReactNode; adminName: string }) {
  const path = usePathname();
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }
  const { listings, disputes, reports, payouts, payments, loading, error, dismissError } = useAdmin();
  const counts: Record<string, number> = {
    "/admin/listings": listings.filter((l) => l.status === "pending_review").length,
    "/admin/disputes": disputes.filter((d) => d.status === "open").length,
    "/admin/reports": reports.filter((r) => r.status === "open").length,
    "/admin/payouts": payouts.filter((p) => p.status === "pending").length,
    "/admin/payments": payments.filter((p) => p.status === "needs_review").length,
  };
  const nav = [
    ["/admin", "Overview"], ["/admin/listings", "Listings"], ["/admin/users", "Users and sellers"], ["/admin/orders", "Orders"],
    ["/admin/disputes", "Disputes"], ["/admin/reports", "Reports"], ["/admin/support", "Support"], ["/admin/payments", "Payments"], ["/admin/payouts", "Payouts"],
    ["/admin/settings", "Fees and settings"], ["/admin/audit-log", "Audit log"],
  ];
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/admin" className="font-bold tracking-tight">CODM Admin</Link>
          <span className="flex items-center gap-3 text-xs">
            <Link href="/" className="text-mute underline underline-offset-4 hover:text-ink">View site</Link>
            <button onClick={signOut} className="text-mute underline underline-offset-4 hover:text-ink">Sign out</button>
          </span>
        </div>
        <p className="-mt-2 px-5 pb-3 text-xs text-mute">Signed in as {adminName}</p>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-6">
          {nav.map(([href, label]) => {
            const active = href === "/admin" ? path === href : path.startsWith(href);
            const n = counts[href];
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm ${active ? "bg-black text-olive" : "text-mute hover:text-ink"}`}>
                {label}
                {n > 0 && <span className="rounded-sm bg-olive px-1.5 text-xs font-medium text-white">{n}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {error && (
            <div role="alert" className="mb-6 flex items-start justify-between gap-4 border-l-2 border-alert pl-3 text-sm">
              <p className="text-alert">{error}</p>
              <button onClick={dismissError} className="shrink-0 text-mute underline underline-offset-4">Dismiss</button>
            </div>
          )}
          {loading ? <p className="text-sm text-mute">Loading admin data</p> : children}
        </div>
      </main>
    </div>
  );
}
