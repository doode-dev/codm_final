"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { refundOrder as refundOrderAction } from "@/app/admin/actions";
import {
  initialSettings,
  type AdminListing, type AdminOrder, type AdminPayment, type AdminUser, type AuditEntry, type Dispute, type ListingStatus,
  type OrderStatus, type Payout, type Report, type SellerVerification, type Settings,
} from "@/data/admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

// Settings are stored as rows in site_settings with snake_case keys.
const SETTING_KEYS: Record<keyof Settings, string> = {
  sellerCommissionPct: "seller_commission_pct", buyerFeePct: "buyer_fee_pct", reviewWindowDays: "review_window_days",
  autoApproveVerifiedSellers: "auto_approve_verified_sellers", maintenanceMode: "maintenance_mode",
};

type Ctx = {
  users: AdminUser[]; listings: AdminListing[]; orders: AdminOrder[]; disputes: Dispute[]; reports: Report[];
  payouts: Payout[]; payments: AdminPayment[]; settings: Settings; audit: AuditEntry[];
  loading: boolean; error: string | null; dismissError: () => void; reload: () => Promise<void>;
  nameOf: (id: string) => string;
  setListingStatus: (id: string, status: ListingStatus, note?: string) => void;
  toggleFeatured: (id: string) => void;
  deleteListing: (id: string, note: string) => void;
  approveListing: (id: string, verified: boolean) => void;
  refundOrder: (id: string, note: string) => void;
  resolvePayment: (reference: string, note: string) => void;
  banUser: (id: string, note: string) => void;
  unbanUser: (id: string) => void;
  setVerification: (id: string, v: SellerVerification) => void;
  setOrderStatus: (id: string, status: OrderStatus, note?: string) => void;
  resolveDispute: (id: string, outcome: "buyer" | "seller", note: string) => void;
  resolveReport: (id: string, status: "actioned" | "dismissed", note?: string) => void;
  setPayoutStatus: (id: string, status: Payout["status"], note?: string) => void;
  saveSettings: (next: Settings) => void;
};

const AdminContext = createContext<Ctx | null>(null);
export const useAdmin = () => {
  const c = useContext(AdminContext);
  if (!c) throw new Error("useAdmin must be used inside AdminProvider");
  return c;
};

const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

export default function AdminProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const me = useRef<{ id: string; name: string } | null>(null);
  const client = useRef<ReturnType<typeof createClient> | null>(null);
  const db = () => (client.current ??= createClient());

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await db().auth.getUser();
      if (user) {
        const { data: p } = await db().from("profiles").select("username").eq("id", user.id).single();
        me.current = { id: user.id, name: p?.username ?? "admin" };
      }
      const [u, l, o, d, r, p, s, a, pay] = await Promise.all([
        db().rpc("admin_users"),
        db().from("listings").select("id,title,seller_id,price_cents,status,featured,created_at").order("created_at", { ascending: false }),
        db().from("orders").select("*, listings(title)").order("created_at", { ascending: false }),
        db().from("disputes").select("*").order("opened_at", { ascending: false }),
        db().from("reports").select("*").order("created_at", { ascending: false }),
        db().from("payouts").select("*").order("requested_at", { ascending: false }),
        db().from("site_settings").select("key,value"),
        db().from("audit_logs").select("*, profiles(username)").order("at", { ascending: false }).limit(200),
        db().from("payments").select("*").order("created_at", { ascending: false }).limit(300),
      ]);
      for (const res of [u, l, o, d, r, p, s, a, pay]) fail(res.error);

      const reportRows = (r.data ?? []) as Row[];
      const openOnListing = new Map<string, number>();
      reportRows.filter((x) => x.status === "open" && x.target_type === "listing")
        .forEach((x) => openOnListing.set(x.target_id, (openOnListing.get(x.target_id) ?? 0) + 1));

      setUsers(((u.data ?? []) as Row[]).map((x) => ({
        id: x.id, username: x.username, email: x.email, country: x.country ?? "", role: x.role, status: x.status,
        emailVerified: x.email_verified, sellerVerification: x.seller_verification, joinedAt: x.joined_at,
        lastLogin: x.last_login ?? x.joined_at, phone: x.phone ?? "", phoneVerified: !!x.phone_verified, orders: Number(x.orders), sales: Number(x.sales), reports: Number(x.reports),
      })));
      setListings(((l.data ?? []) as Row[]).map((x) => ({
        id: x.id, title: x.title, sellerId: x.seller_id, price: x.price_cents, status: x.status, createdAt: x.created_at,
        featured: x.featured, reports: openOnListing.get(x.id) ?? 0,
      })));
      setOrders(((o.data ?? []) as Row[]).map((x) => ({
        id: x.id, listingId: x.listing_id, title: x.listing_title || x.listings?.title || x.listing_id, buyerId: x.buyer_id, sellerId: x.seller_id,
        price: x.price_cents, buyerFee: x.buyer_fee_cents, commission: x.commission_cents, total: x.total_cents,
        status: x.status, createdAt: x.created_at, paymentRef: x.payment_ref ?? "none",
      })));
      setDisputes(((d.data ?? []) as Row[]).map((x) => ({
        id: x.id, orderId: x.order_id, openedBy: x.opened_by, reason: x.reason, evidence: x.evidence_count,
        status: x.status, openedAt: x.opened_at, note: x.note ?? undefined,
      })));
      setReports(reportRows.map((x) => ({
        id: x.id, targetType: x.target_type, targetId: x.target_id, reporterId: x.reporter_id, reason: x.reason,
        status: x.status, createdAt: x.created_at,
      })));
      setPayouts(((p.data ?? []) as Row[]).map((x) => ({
        id: x.id, sellerId: x.seller_id, orderId: x.order_id, amount: x.amount_cents, status: x.status, requestedAt: x.requested_at,
      })));
      const next = { ...initialSettings } as Record<string, unknown>;
      for (const row of (s.data ?? []) as Row[]) {
        const k = (Object.keys(SETTING_KEYS) as (keyof Settings)[]).find((key) => SETTING_KEYS[key] === row.key);
        if (k) next[k] = row.value;
      }
      setSettings(next as Settings);
      setPayments(((pay.data ?? []) as Row[]).map((x) => ({
        reference: x.reference, userId: x.user_id, orderIds: x.order_ids, amount: Number(x.amount_minor), currency: x.currency,
        status: x.status, note: x.note ?? undefined, createdAt: x.created_at,
      })));
      setAudit(((a.data ?? []) as Row[]).map((x) => ({
        id: `A-${x.id}`, at: x.at, actor: x.profiles?.username ?? "admin", action: x.action, target: x.target, note: x.note ?? undefined,
      })));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<void>) => {
    try { await fn(); setError(null); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
  };

  // Updates one row and makes sure a row really changed (row level security hides rows silently).
  const update = async (table: string, patch: Row, col: string, val: string) => {
    const { data, error: e } = await db().from(table).update(patch).eq(col, val).select(col);
    fail(e);
    if (!data?.length) throw new Error("Nothing was changed. Are you signed in as an admin?");
  };

  const log = async (action: string, target: string, note?: string) => {
    if (!me.current) return;
    const { error: e } = await db().from("audit_logs").insert({ actor_id: me.current.id, action, target, note: note ?? null });
    fail(e);
    setAudit((a) => [{ id: `A-${Date.now()}`, at: new Date().toISOString(), actor: me.current!.name, action, target, note }, ...a]);
  };
  const label = (s: string) => s.replace(/_/g, " ");

  const value: Ctx = {
    users, listings, orders, disputes, reports, payouts, payments, settings, audit, loading, error,
    dismissError: () => setError(null),
    reload: load,
    nameOf: (id) => users.find((x) => x.id === id)?.username ?? id.slice(0, 8),

    setListingStatus: (id, status, note) => run(async () => {
      const patch: Row = { status, reviewed_at: new Date().toISOString() };
      if (note) patch.moderation_notes = note;
      if (status !== "active") patch.featured = false;
      await update("listings", patch, "id", id);
      setListings((ls) => ls.map((x) => (x.id === id ? { ...x, status, featured: status === "active" ? x.featured : false } : x)));
      await log(`Listing set to ${label(status)}`, id, note);
    }),
    toggleFeatured: (id) => run(async () => {
      const cur = listings.find((x) => x.id === id);
      if (!cur) return;
      await update("listings", { featured: !cur.featured }, "id", id);
      setListings((ls) => ls.map((x) => (x.id === id ? { ...x, featured: !x.featured } : x)));
      await log(cur.featured ? "Removed from featured" : "Featured listing", id);
    }),
    deleteListing: (id, note) => run(async () => {
      const { data, error: e } = await db().from("listings").delete().eq("id", id).select("id");
      fail(e);
      if (!data?.length) throw new Error("Nothing was deleted. Are you signed in as an admin?");
      setListings((ls) => ls.filter((x) => x.id !== id));
      await log("Deleted listing", id, note);
    }),
    approveListing: (id, verified) => run(async () => {
      await update("listings", {
        status: "active", reviewed_at: new Date().toISOString(),
        moderation_notes: verified ? "Approved. Attributes checked against the screenshots." : "Approved",
        verification_status: verified ? "attributes_verified" : "seller_declared",
      }, "id", id);
      setListings((ls) => ls.map((x) => (x.id === id ? { ...x, status: "active" } : x)));
      await log("Listing approved", id, verified ? "Attributes verified" : undefined);
    }),
    refundOrder: (id, note) => run(async () => {
      const r = await refundOrderAction(id, note); // runs on the server, and refunds through Paystack when the order was paid there
      if (r.error) throw new Error(r.error);
      setOrders((os) => os.map((x) => (x.id === id ? { ...x, status: "refunded" } : x)));
      await load();
    }),
    resolvePayment: (reference, note) => run(async () => {
      await update("payments", { status: "resolved", note }, "reference", reference);
      setPayments((ps) => ps.map((x) => (x.reference === reference ? { ...x, status: "resolved", note } : x)));
      await log("Payment resolved", reference, note);
    }),
    banUser: (id, note) => run(async () => {
      const { data, error: e } = await db().rpc("admin_set_user_status", { target: id, new_status: "banned" });
      fail(e);
      const n = Number(data ?? 0);
      setUsers((us) => us.map((x) => (x.id === id ? { ...x, status: "banned" } : x)));
      setListings((ls) => ls.map((x) => (x.sellerId === id && ["active", "pending_review", "reserved"].includes(x.status) ? { ...x, status: "suspended", featured: false } : x)));
      await log("Banned user", id, n ? `${note}. ${n} listing(s) suspended.` : note);
    }),
    unbanUser: (id) => run(async () => {
      const { error: e } = await db().rpc("admin_set_user_status", { target: id, new_status: "active" });
      fail(e);
      setUsers((us) => us.map((x) => (x.id === id ? { ...x, status: "active" } : x)));
      await log("Unbanned user", id);
    }),
    setVerification: (id, v) => run(async () => {
      const { error: e } = await db().rpc("admin_set_seller_verification", { target: id, new_value: v });
      fail(e);
      setUsers((us) => us.map((x) => (x.id === id ? { ...x, sellerVerification: v } : x)));
      await log(`Seller verification ${v}`, id);
    }),
    setOrderStatus: (id, status, note) => run(async () => {
      await update("orders", { status }, "id", id);
      setOrders((os) => os.map((x) => (x.id === id ? { ...x, status } : x)));
      await log(`Order set to ${label(status)}`, id, note);
    }),
    resolveDispute: (id, outcome, note) => run(async () => {
      const d = disputes.find((x) => x.id === id);
      if (!d) return;
      const status = outcome === "buyer" ? "resolved_buyer" : "resolved_seller";
      await update("disputes", { status, note, resolved_at: new Date().toISOString() }, "id", id);
      await update("orders", { status: outcome === "buyer" ? "refunded" : "completed" }, "id", d.orderId);
      if (outcome === "seller") {
        const { error: e } = await db().from("payouts").update({ status: "pending" }).eq("order_id", d.orderId).eq("status", "on_hold");
        fail(e);
        setPayouts((ps) => ps.map((p) => (p.orderId === d.orderId && p.status === "on_hold" ? { ...p, status: "pending" } : p)));
      }
      setDisputes((ds) => ds.map((x) => (x.id === id ? { ...x, status, note } : x)));
      setOrders((os) => os.map((x) => (x.id === d.orderId ? { ...x, status: outcome === "buyer" ? "refunded" : "completed" } : x)));
      await log(outcome === "buyer" ? "Dispute resolved: buyer refunded" : "Dispute resolved: seller paid", id, note);
    }),
    resolveReport: (id, status, note) => run(async () => {
      await update("reports", { status }, "id", id);
      setReports((rs) => rs.map((x) => (x.id === id ? { ...x, status } : x)));
      await log(status === "actioned" ? "Report actioned" : "Report dismissed", id, note);
    }),
    setPayoutStatus: (id, status, note) => run(async () => {
      await update("payouts", status === "paid" ? { status, paid_at: new Date().toISOString() } : { status }, "id", id);
      setPayouts((ps) => ps.map((x) => (x.id === id ? { ...x, status } : x)));
      await log(`Payout set to ${label(status)}`, id, note);
    }),
    saveSettings: (next) => run(async () => {
      const changed = (Object.keys(next) as (keyof Settings)[]).filter((k) => next[k] !== settings[k]);
      if (!changed.length) return;
      const rows = changed.map((k) => ({ key: SETTING_KEYS[k], value: next[k], updated_at: new Date().toISOString() }));
      fail((await db().from("site_settings").upsert(rows)).error);
      setSettings(next);
      for (const k of changed) await log("Changed setting", SETTING_KEYS[k], `${String(settings[k])} to ${String(next[k])}`);
    }),
  };
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
