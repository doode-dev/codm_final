export type PayMode = "paystack" | "test" | "manual";

// paystack: the buyer pays on Paystack's secure page.
// test:     the Pay button marks orders paid at once. Development only.
// manual:   the buyer pays outside the site and an admin marks the order paid.
// In production the mode is paystack when it is configured, otherwise manual. Never test.
export function payMode(): PayMode {
  const hasPaystack = !!process.env.PAYSTACK_SECRET_KEY && !!process.env.SITE_URL;
  if (process.env.NODE_ENV === "production") return hasPaystack ? "paystack" : "manual";
  const m = process.env.PAYMENT_MODE;
  if (m === "manual" || m === "test") return m;
  return hasPaystack ? "paystack" : "test";
}

export const paymentInstructions = () =>
  process.env.PAYMENT_INSTRUCTIONS ||
  "Our team will message you with payment details shortly. Quote your order number when you pay. Your order stays reserved until the time shown above.";
