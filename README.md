# CODM Accounts

Next.js (App Router, TypeScript), Tailwind v4, Supabase and Paystack marketplace for Call of Duty: Mobile accounts.

## Run it

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill it in.
3. `npm run dev` and open http://localhost:3000

## Database (new Supabase project)

In the SQL editor run, in this order: `supabase/setup.sql`, then `supabase/upgrade-1.sql`. Then optionally `supabase/seed-demo.sql` (15 demo accounts; needs a seller).

Supabase dashboard settings:
1. Authentication > URL Configuration: Site URL `http://localhost:3000`; add `http://localhost:3000/auth/callback` to Redirect URLs. Add your real domain too when you deploy.
2. Authentication > Sign In / Providers > Email: while testing you can turn "Confirm email" off. Turn it on before launch. Set a minimum password length of 8 or more.
3. Authentication > Sign In / Providers > Phone: turn it ON and connect an SMS provider (Twilio, MessageBird, Vonage or TextLocal). Sellers verify their number with a code sent this way.
   To test without sending real texts, add a test number and fixed code in the same panel ("Test Phone Numbers and OTPs").
4. Authentication > Multi-Factor: make sure TOTP is enabled. The admin panel requires it.
5. Authentication > Attack Protection: turn on CAPTCHA (Cloudflare Turnstile or hCaptcha) before launch, to stop bots signing up and abusing SMS.

## Make yourself the admin

Register on the site, then at the bottom of `setup.sql` uncomment the statement, put your email in, and run only that line.
Open `/admin/login`: you sign in, then set up two-factor with an authenticator app (first time) or enter a code. Without a valid two-factor session
neither the website nor the database will let you do admin actions. If you lose your authenticator, remove the factor in the Supabase dashboard (Authentication > Users).

## Paystack

1. Create a Paystack account and copy the TEST secret key into `PAYSTACK_SECRET_KEY`. Set `SITE_URL`.
2. If your account charges in GHS, NGN, etc., set `PAYSTACK_CURRENCY` and `PAYSTACK_FX_RATE` (prices stay in dollars on the site).
3. Dashboard > Settings > API Keys & Webhooks: set the webhook URL to `https://YOUR-SITE/api/paystack/webhook`. (Locally, use a tunnel such as ngrok. Without it, the callback page still confirms payments when buyers return.)
4. Test with Paystack's test cards. Payments are confirmed by asking Paystack directly, the amount is checked, and each payment is applied once.
5. Before going live, switch to the live key, and check Paystack allows this business: selling game accounts may be refused.

## Security in place

Row level security on every table; admin actions need the admin role AND two-factor, checked in middleware, in the server, and in the database;
payment webhooks are signature-checked; the service key is server-only; buyers can't mark orders paid; rate limits on messages, reports, tickets and listings in the database;
banned users are signed out and blocked from the shop; sellers need a verified phone to list; security headers on every page.
Still to do for launch: CAPTCHA (above), a custom domain with HTTPS, a lawyer's review of `data/legal.ts`, and regular backups (Supabase Pro has daily backups).

## Pages

`/` home and `/accounts` browse; `/info`; `/cart`, `/checkout`, `/orders`, `/profile`; `/sell`; `/admin/login` then `/admin` (overview, listings with a full review screen, users, orders, payments, disputes, reports, payouts, support, settings, audit log).
