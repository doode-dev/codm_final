export const ranks = ["Rookie", "Veteran", "Elite", "Pro", "Master", "Grandmaster", "Legendary"] as const;
export type Rank = (typeof ranks)[number];

export const fees = { sellerCommissionPct: 10, buyerFeePct: 5, currency: "USD" };

export const buySteps = [
  { title: "Find an account", body: "Filter by rank, level, price and inventory. Open a listing to see every item, the seller's record and the disclosed risks." },
  { title: "Check the total", body: "The checkout shows the asking price, our buyer fee and any tax before you pay. Nothing is added afterwards." },
  { title: "Pay through the platform", body: "Payment is held by us. The seller is paid only after you confirm the account matches the listing." },
  { title: "Get your account from the seller", body: "After payment, the seller shares the access steps with you in the private chat on your order page. Never move that conversation elsewhere." },
  { title: "Confirm or report a problem", body: "You have a fixed review window to confirm receipt or open a dispute with screenshots as evidence." },
];

export const sellSteps = [
  { title: "Create a seller profile", body: "Choose a seller name and add a phone number. We text you a code to verify it. Larger sales may need an identity check." },
  { title: "Submit the listing", body: "Fill in level, ranks, items and screenshots. Never include passwords or one-time codes." },
  { title: "Wait for review", body: "A moderator checks the listing against the screenshots. Approved listings go live; rejected ones come back with a reason." },
  { title: "Get paid", body: "After the buyer confirms, the sale price minus our commission is released to your payout method." },
];

export const trust = [
  { title: "Reviewed listings", body: "Every listing is checked by a moderator before it appears. Attributes are marked verified only when we checked them." },
  { title: "Held payments", body: "Buyers pay us, not the seller. Funds are released after confirmation or when a dispute is resolved." },
  { title: "No credentials in public", body: "Listings never show passwords, codes or recovery details. Access steps are shared only in the private order chat, which our team can read if there is a dispute." },
  { title: "Report anything", body: "Every listing and seller has a report button. Reports are read by staff and logged." },
];

export const faqs = [
  { q: "Is buying a Call of Duty: Mobile account allowed?", a: "No. Activision's terms prohibit buying, selling or transferring accounts. A purchased account can be restricted or banned, and the original owner may recover it. We do not guarantee permanent access. Read the risk disclosure before you buy or sell." },
  { q: "What do the fees cover?", a: "Sellers pay a 10% commission on completed sales. Buyers pay a 5% service fee shown at checkout. Fees cover payment handling, moderation and dispute support." },
  { q: "When do I get my money back?", a: "If a listing differs materially from what was sold and you report it inside the review window with evidence, you may be refunded. Each case is decided individually." },
  { q: "How long does a listing take to go live?", a: "Most listings are reviewed within one working day. You can edit, pause or withdraw a listing at any time before it is reserved." },
  { q: "Can I use a different payment method?", a: "Only the instructions shown on your payment page. Always quote your order number, and never pay a seller directly. Staff will never ask you to pay anyone else." },
];

export const legalLinks = [
  ["Terms of service", "/legal/terms"], ["Privacy policy", "/legal/privacy"], ["Cookie policy", "/legal/cookies"],
  ["Refund and dispute policy", "/legal/refunds"], ["Seller policy", "/legal/seller-policy"],
  ["Buyer policy", "/legal/buyer-policy"], ["Risk disclosure", "/legal/risk-disclosure"],
];

export const countries = ["Ghana", "Nigeria", "Kenya", "South Africa", "United States", "Canada", "United Kingdom", "Germany", "India", "Philippines", "Brazil", "Other"];
