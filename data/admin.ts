import { listings as publicListings } from "./accounts";

/* Dummy admin data. Money is in cents. Replace with database queries. */

export type ListingStatus = "draft" | "pending_review" | "active" | "reserved" | "sold" | "rejected" | "withdrawn" | "suspended" | "expired" | "removed";
export type OrderStatus = "created" | "awaiting_payment" | "paid" | "under_review" | "completed" | "payment_failed" | "cancelled" | "refund_pending" | "refunded" | "disputed";
export type SellerVerification = "none" | "pending" | "verified" | "rejected";

export type AdminUser = {
  id: string; username: string; email: string; country: string; role: "buyer" | "seller" | "both" | "admin"; phone?: string; phoneVerified?: boolean;
  status: "active" | "banned"; emailVerified: boolean; sellerVerification: SellerVerification;
  joinedAt: string; lastLogin: string; orders: number; sales: number; reports: number;
};
export type AdminListing = { id: string; title: string; sellerId: string; price: number; status: ListingStatus; createdAt: string; featured: boolean; reports: number };
export type AdminOrder = {
  id: string; listingId: string; title: string; buyerId: string; sellerId: string; price: number; buyerFee: number; commission: number;
  total: number; status: OrderStatus; createdAt: string; paymentRef: string;
};
export type Dispute = { id: string; orderId: string; openedBy: string; reason: string; evidence: number; status: "open" | "resolved_buyer" | "resolved_seller"; openedAt: string; note?: string };
export type Report = { id: string; targetType: "listing" | "user"; targetId: string; reporterId: string; reason: string; status: "open" | "actioned" | "dismissed"; createdAt: string };
export type Payout = { id: string; sellerId: string; orderId: string; amount: number; status: "pending" | "on_hold" | "paid"; requestedAt: string };
export type AdminPayment = { reference: string; userId: string; orderIds: string[]; amount: number; currency: string; status: string; note?: string; createdAt: string };
export type AuditEntry = { id: string; at: string; actor: string; action: string; target: string; note?: string };
export type Settings = { sellerCommissionPct: number; buyerFeePct: number; reviewWindowDays: number; autoApproveVerifiedSellers: boolean; maintenanceMode: boolean };

export const initialSettings: Settings = { sellerCommissionPct: 10, buyerFeePct: 5, reviewWindowDays: 3, autoApproveVerifiedSellers: false, maintenanceMode: false };

const u = (id: string, username: string, email: string, country: string, role: AdminUser["role"], v: SellerVerification, joinedAt: string,
  orders: number, sales: number, reports: number, extra: Partial<AdminUser> = {}): AdminUser =>
  ({ id, username, email, country, role, status: "active", emailVerified: true, sellerVerification: v, joinedAt, lastLogin: "2026-10-19", orders, sales, reports, ...extra });

export const initialUsers: AdminUser[] = [
  u("U-1042", "kofi_loadouts", "kofi@example.com", "Ghana", "seller", "verified", "2024-03-12", 0, 38, 0),
  u("U-2217", "maren.v", "maren@example.com", "Germany", "seller", "verified", "2025-06-02", 0, 12, 0),
  u("U-3390", "tobi_sells", "tobi@example.com", "Nigeria", "seller", "pending", "2026-08-19", 0, 3, 2),
  u("U-4001", "ama_k", "ama@example.com", "Ghana", "buyer", "none", "2026-02-14", 5, 0, 0),
  u("U-4002", "jdoe_88", "jdoe@example.com", "United States", "buyer", "none", "2026-05-03", 3, 0, 0),
  u("U-4003", "nanayaw", "nanayaw@example.com", "Ghana", "both", "pending", "2026-07-21", 2, 0, 1),
  u("U-4004", "zed_ph", "zed@example.com", "Philippines", "buyer", "none", "2026-09-01", 1, 0, 0, { status: "banned", lastLogin: "2026-10-09" }),
  u("U-4005", "lena_b", "lena@example.com", "Germany", "buyer", "none", "2026-09-27", 2, 0, 0, { emailVerified: false }),
];

const l = (id: string, title: string, sellerId: string, price: number, status: ListingStatus, createdAt: string, reports = 0): AdminListing =>
  ({ id, title, sellerId, price, status, createdAt, featured: false, reports });

export const initialListings: AdminListing[] = [
  ...publicListings.map((p): AdminListing => ({
    id: p.id, title: p.title, sellerId: "U-" + p.seller.id.slice(2), price: p.pricing.askingPrice,
    status: p.status, createdAt: p.createdAt, featured: p.featured, reports: 0,
  })),
  l("CM-48390", "Level 132, Master rank, 2 mythic items", "U-2217", 14500, "pending_review", "2026-10-20"),
  l("CM-48388", "Level 77, Pro rank, legendary starter set", "U-3390", 3900, "pending_review", "2026-10-19"),
  l("CM-48301", "Level 205, Legendary rank, 5 mythic items", "U-3390", 39000, "suspended", "2026-10-10", 2),
  l("CM-47010", "Level 40, Veteran rank", "U-3390", 1500, "rejected", "2026-09-30"),
  l("CM-46500", "Level 150, Grandmaster rank, 3 mythic items", "U-1042", 24000, "sold", "2026-09-20"),
];

const o = (id: string, listingId: string, title: string, buyerId: string, sellerId: string, price: number, status: OrderStatus, createdAt: string, paymentRef: string): AdminOrder => {
  const buyerFee = Math.round(price * 0.05);
  return { id, listingId, title, buyerId, sellerId, price, buyerFee, commission: Math.round(price * 0.1), total: price + buyerFee, status, createdAt, paymentRef };
};

export const initialOrders: AdminOrder[] = [
  o("O-10031", "CM-46500", "Level 150, Grandmaster rank, 3 mythic items", "U-4001", "U-1042", 24000, "completed", "2026-09-28", "pi_3Qa81xK"),
  o("O-10037", "CM-45992", "Level 88, Pro rank, 7 legendary weapons", "U-4002", "U-2217", 5800, "completed", "2026-10-02", "pi_3Qb12mT"),
  o("O-10041", "CM-46120", "Level 120, Master rank, 2 mythic items", "U-4003", "U-3390", 9900, "disputed", "2026-10-06", "pi_3Qc77aP"),
  o("O-10046", "CM-46331", "Level 60, Elite rank", "U-4004", "U-3390", 2200, "refunded", "2026-10-09", "pi_3Qd05zL"),
  o("O-10049", "CM-46870", "Level 171, Grandmaster rank, 4 mythic items", "U-4001", "U-1042", 28800, "under_review", "2026-10-15", "pi_3Qe44hR"),
  o("O-10052", "CM-47155", "Level 64, Elite rank, starter collection", "U-4005", "U-3390", 2400, "awaiting_payment", "2026-10-19", "pending"),
  o("O-10053", "CM-47611", "Level 143, Master rank, 2 mythic items", "U-4002", "U-1042", 11800, "paid", "2026-10-19", "pi_3Qf90cN"),
  o("O-10054", "CM-47402", "Level 98, Pro rank, 9 legendary weapons", "U-4003", "U-2217", 6200, "payment_failed", "2026-10-20", "pi_3Qg31dW"),
];

export const initialDisputes: Dispute[] = [
  { id: "D-201", orderId: "O-10041", openedBy: "U-4003", reason: "The account is level 98, but the listing said level 120. Screenshots attached.", evidence: 3, status: "open", openedAt: "2026-10-08" },
  { id: "D-198", orderId: "O-10046", openedBy: "U-4004", reason: "The seller regained access after delivery.", evidence: 2, status: "resolved_buyer", openedAt: "2026-10-10", note: "Seller admitted recovering the account. Buyer refunded." },
];

export const initialReports: Report[] = [
  { id: "R-501", targetType: "listing", targetId: "CM-48301", reporterId: "U-4001", reason: "The screenshots look copied from another listing.", status: "open", createdAt: "2026-10-16" },
  { id: "R-502", targetType: "listing", targetId: "CM-48301", reporterId: "U-4002", reason: "The seller asked me to pay outside the platform.", status: "open", createdAt: "2026-10-17" },
  { id: "R-503", targetType: "user", targetId: "U-3390", reporterId: "U-4003", reason: "The seller stopped replying after payment.", status: "open", createdAt: "2026-10-18" },
  { id: "R-499", targetType: "listing", targetId: "CM-45992", reporterId: "U-4005", reason: "The listed rank is wrong.", status: "dismissed", createdAt: "2026-10-12" },
];

export const initialPayouts: Payout[] = [
  { id: "P-3001", sellerId: "U-1042", orderId: "O-10031", amount: 21600, status: "pending", requestedAt: "2026-10-05" },
  { id: "P-3002", sellerId: "U-2217", orderId: "O-10037", amount: 5220, status: "pending", requestedAt: "2026-10-06" },
  { id: "P-3003", sellerId: "U-3390", orderId: "O-10041", amount: 8910, status: "on_hold", requestedAt: "2026-10-09" },
  { id: "P-2990", sellerId: "U-1042", orderId: "O-10012", amount: 14400, status: "paid", requestedAt: "2026-09-20" },
];

export const initialAudit: AuditEntry[] = [
  { id: "A-4", at: "2026-10-19T14:12:00Z", actor: "owner", action: "Resolved dispute", target: "D-198", note: "Buyer refunded" },
  { id: "A-3", at: "2026-10-17T09:40:00Z", actor: "owner", action: "Banned user", target: "U-4004", note: "Chargeback abuse" },
  { id: "A-2", at: "2026-10-16T18:02:00Z", actor: "owner", action: "Changed setting", target: "Buyer fee", note: "4% to 5%" },
  { id: "A-1", at: "2026-10-12T11:20:00Z", actor: "owner", action: "Rejected listing", target: "CM-47010", note: "Screenshots did not match" },
];
