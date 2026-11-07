import crypto from "node:crypto";

// Server only. The secret key must never reach the browser.
const API = "https://api.paystack.co";
const CURRENCIES = ["NGN", "GHS", "ZAR", "KES", "USD"];

// Prices on the site are in US dollars. Paystack charges in your account's currency. If that isn't USD, set
// PAYSTACK_CURRENCY (for example GHS) and PAYSTACK_FX_RATE (how many of that currency one dollar buys).
export function paystackCurrency() {
  const c = (process.env.PAYSTACK_CURRENCY ?? "USD").toUpperCase();
  if (!CURRENCIES.includes(c)) throw new Error(`PAYSTACK_CURRENCY must be one of ${CURRENCIES.join(", ")}.`);
  return c;
}
export function fxRate() {
  const n = Number(process.env.PAYSTACK_FX_RATE ?? "1");
  if (!Number.isFinite(n) || n <= 0) throw new Error("PAYSTACK_FX_RATE must be a number above zero.");
  return n;
}
export const toMinor = (usdCents: number, rate: number) => Math.round(usdCents * rate);
export const formatMinor = (minor: number, currency: string) => new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100);

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Paystack isn't configured.");
  const res = await fetch(API + path, {
    ...init, cache: "no-store", signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status) throw new Error(json?.message ?? `Paystack error ${res.status}`);
  return json.data as T;
}

export const initializeTransaction = (body: {
  email: string; amount: number; currency: string; reference: string; callback_url: string; metadata: Record<string, unknown>;
}) => call<{ authorization_url: string; reference: string }>("/transaction/initialize", { method: "POST", body: JSON.stringify(body) });

export const verifyTransaction = (reference: string) =>
  call<{ status: string; amount: number; currency: string; id: number; reference: string }>(`/transaction/verify/${encodeURIComponent(reference)}`);

export const refundTransaction = (reference: string, amount: number) =>
  call<{ status?: string }>("/refund", { method: "POST", body: JSON.stringify({ transaction: reference, amount }) });

// Paystack signs every webhook with HMAC SHA512 of the raw body, using your secret key.
export function validSignature(raw: string, signature: string | null) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature) return false;
  const expected = Buffer.from(crypto.createHmac("sha512", key).update(raw).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
