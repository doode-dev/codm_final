# CODM Accounts: documentation

A marketplace for Call of Duty: Mobile accounts. Next.js (App Router) + Tailwind + Supabase (database, login, storage) + Paystack (payments).

## 1. Folder map

| Path | What it holds |
|---|---|
| `app/` | Every page and server action (the website). |
| `components/` | Reusable UI, grouped by area (below). |
| `lib/` | Helpers: database clients, checks, Paystack, validation. |
| `data/` | Static content (FAQ text, banners, legal text, demo accounts) and admin types. |
| `supabase/` | SQL to build the database. Run in the Supabase SQL editor. |
| `middleware.ts` | Runs on every request: keeps logins fresh and guards `/admin`. |
| `next.config.ts` | Security headers and upload size limit. |
| `public/banners/` | Home carousel images you add (`banner-1.jpg` to `banner-4.jpg`). |

## 2. Pages (`app/`)

| URL | File | What it does |
|---|---|---|
| `/` | `page.tsx` | Banner carousel + top 10 featured accounts + "Explore all". |
| `/accounts` | `accounts/page.tsx` | All accounts, search, sidebar filters. |
| `/info` | `info/page.tsx` | How buying/selling works, safety, fees, FAQ. |
| `/cart` | `cart/` | Saved cart (stored in the database). |
| `/checkout` | `checkout/` | Review, accept terms, place order (reserves the accounts). |
| `/checkout/pay` | `checkout/pay/` | Pay with Paystack (or test/manual mode). |
| `/checkout/paystack/callback` | `checkout/paystack/callback/` | Where Paystack sends buyers back; confirms the payment. |
| `/api/paystack/webhook` | `api/paystack/webhook/route.ts` | Paystack calls this; signature-checked. |
| `/orders`, `/orders/[id]` | `orders/` | Buyer's orders; order page with chat, confirm receipt, report a problem. |
| `/profile` | `profile/` | Username/country, recent orders, saved accounts, password. |
| `/sell` | `sell/page.tsx` | No seller profile: create one. Seller: insights, listings, orders, phone verification. |
| `/sell/new`, `/sell/edit/[id]` | `sell/new/`, `sell/edit/[id]/` | Listing form (create / edit). Each has `actions.ts`. |
| `/auth/*` | `auth/` | `login`, `register` (buy/sell/both), `verify-email`, `forgot-password`, `reset-password`, `mfa` (two-factor), `callback` (email links). |
| `/contact` | `contact/` | Support form (saved as a ticket). |
| `/legal/[slug]` | `legal/[slug]/` | Policy pages, text in `data/legal.ts` (draft). |
| `/admin/login` | `admin/login/` | Admin sign-in, then two-factor. |
| `/admin/*` | `admin/(panel)/` | Overview, listings, users, orders, disputes, reports, payments, payouts, support, settings, audit log. `layout.tsx` there blocks everyone who isn't a verified admin. |

## 3. Components (`components/`)

- Top level: `Header`, `HeaderAuth` (login/cart/profile menu), `Footer`, `Banner`, `HomeAccounts`, `AccountBrowser` (filters + list), `ListingRow` (one account), `Detail` (account popup), `InfoSections`.
- `shop/`: `ShopProvider` (cart + saved state), `Buttons` (add to cart, buy now, save, report), `CartView`, `CheckoutForm`, `PayPanel`.
- `orders/`: `OrderActions`, `MessageForm`. `profile/`: forms and saved list. `support/`: contact form.
- `seller/`: `ListingForm`, `ListingActions`, `PhoneVerify`, `SellerRegistrationForm`, `ProfileEditor`.
- `auth/`: `ui` (shared fields), `LoginForm`, `RegisterForm`, `ForgotForm`, `ResetForm`, `MfaPanel`.
- `admin/`: `store.tsx` (loads and changes all admin data), `ui.tsx`, `AdminShell`, `AdminLoginForm`, `ListingReview`.

## 4. Helpers (`lib/`)

`supabase/client.ts` (browser), `supabase/server.ts` (server, user's login), `supabase/admin.ts` (server only, service key), `supabase/middleware.ts` (the `/admin` gate) ·
`auth.ts` (`requireAdmin`) · `listings.ts` (`getListings`: reads accounts for sale) · `cart.ts` · `paystack.ts` (API calls, signature check, currency) ·
`paystack-settle.ts` (confirm payment with Paystack, then mark orders paid) · `payments.ts` (payment mode) · `phone.ts`, `validate.ts`, `format.ts` ·
`listing-input.ts` (listing form rules), `listing-media.ts` (screenshot upload).

## 5. How things flow

**Account listing:** seller submits → `pending_review` → admin opens **Review** → `active` (shown on site). Editing a live listing sends it back to review. Pausing → `withdrawn`.

**Buying:** add to cart → checkout creates one order per account and reserves it (`reserved`) → pay on Paystack → order `paid` → seller sends access steps in the order chat → buyer presses "I received the account" → `completed`, listing `sold`, seller payout created (`pending`) → admin approves the payout.
Unpaid for 60 minutes: order cancelled, account back on sale. Problem within 3 days of payment: buyer opens a dispute → payout on hold → admin refunds or releases.

**Sign-up:** "buy" = basic details. "Sell" or "both" = also a seller profile; after logging in the seller verifies their phone (text code) on `/sell` before listing.

## 6. Database (`supabase/`)

Run `setup.sql`, then `upgrade-1.sql`; `seed-demo.sql` adds 15 demo accounts.

Tables: `profiles` (every user, role, status) · `sellers` (private phone, bio) · `listings` · `orders` · `payments` (Paystack records) · `payouts` · `disputes` · `order_messages` · `cart_items` · `favorites` · `reports` · `support_tickets` · `audit_logs` (admin actions) · `site_settings` (fees, windows).
View: `seller_public` (safe seller info). Storage bucket: `listing-media` (screenshots).
Key functions: `checkout_cart` (reserve + create orders), `settle_payment` (mark paid once, check amount), `confirm_order`, `open_dispute`, `cancel_order`, `become_seller`, `seller_phone_verified`, `is_admin` (needs two-factor), `admin_*` (admin-only).
Every table has row level security: users only see and change their own data.

## 7. Settings (`.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Connect to Supabase (safe in the browser). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Marks payments, refunds. Never share. |
| `SITE_URL` | Your site's address; Paystack returns buyers here. |
| `PAYSTACK_SECRET_KEY` | Server only. `sk_test_...` while testing. |
| `PAYSTACK_CURRENCY`, `PAYSTACK_FX_RATE` | Currency Paystack charges and dollars-to-that-currency rate. |
| `PAYMENT_MODE`, `PAYMENT_INSTRUCTIONS` | Optional fallbacks: `test` (dev only) or `manual`. |

Fees, review window and maintenance mode are changed in **/admin/settings**, not in code.

## 8. Creating the admin account

1. Register normally at `/auth/register` (choose "I'm here to buy") and confirm the email.
2. Supabase > SQL editor, run (with your email):
   `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`
3. Go to `/admin/login`, sign in, scan the QR code with an authenticator app, enter the 6-digit code. You land on `/admin`.

## 9. Common problems

| Problem | Cause / fix |
|---|---|
| `/admin` shows a 404 | Your account isn't `admin` yet (step 2 above), or the account is banned. |
| `/admin` sends you to login | Not signed in. Use `/admin/login`. |
| Two-factor page errors | In Supabase, Authentication > Multi-Factor: make sure TOTP is enabled. |
| No accounts on the home page | `listings` is empty, none are `active`, or their owner is an admin (admins aren't sellers). Use a separate seller account and run `seed-demo.sql`. |
| Seller can't list | Phone not verified, or SMS provider not set up in Supabase (Authentication > Providers > Phone). |
| Paid but order still unpaid | Check `SITE_URL`, the webhook URL in Paystack, and the **Payments** page in admin. |
| Changed `.env.local` and nothing changed | Restart `npm run dev`. |
