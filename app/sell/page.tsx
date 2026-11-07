import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { date, money } from "@/lib/format";
import { Badge, Empty, Table } from "@/components/admin/ui";
import SellerRegistrationForm from "@/components/seller/SellerRegistrationForm";
import ProfileEditor from "@/components/seller/ProfileEditor";
import ListingActions from "@/components/seller/ListingActions";
import PhoneVerify from "@/components/seller/PhoneVerify";
import { td, th } from "@/components/seller/styles";

export const metadata = {
  title: "Seller centre | CODM Accounts",
  description: "Create your seller profile and manage your Call of Duty: Mobile account listings.",
};

const notices: Record<string, string> = {
  created: "Listing submitted. A moderator will review it, usually within a day.",
  updated: "Changes saved. The listing is back in review.",
  paused: "Listing paused. Buyers can't see it any more.",
  reactivated: "Listing sent for review again.",
  deleted: "Listing deleted.",
};
const steps = [
  ["Create your seller profile", "Choose a seller name and add a private contact number."],
  ["List an account", "Add the details and screenshots. A moderator reviews every listing."],
  ["Get paid", "Buyers pay us. You are paid after they confirm the account, minus our 10% commission."],
];
const sum = (n: number[]) => n.reduce((s, x) => s + x, 0);

export default async function SellPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/sell");

  const { data: profile } = await supabase.from("profiles")
    .select("role,status,seller_verification,seller_rating,completed_sales").eq("id", user.id).single();
  if (!profile || profile.status !== "active") redirect("/");

  if (profile.role === "admin") {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold tracking-tight">Admin accounts can&apos;t sell</h1>
        <p className="mt-3 text-sm leading-relaxed text-mute">Use a separate account to list accounts for sale, so selling never mixes with running the marketplace.</p>
        <Link href="/admin" className="mt-5 inline-block rounded-sm bg-olive px-4 py-2 text-sm font-medium text-white hover:bg-olive-dark">Go to the admin panel</Link>
      </div>
    );
  }

  const { data: seller } = await supabase.from("sellers").select("username,phone,bio,created_at").eq("id", user.id).maybeSingle();

  // 1. No seller profile yet: onboarding
  if (!seller) {
    return (
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-14">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Sell your Call of Duty: Mobile account</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mute">
            Set up a seller profile first. It takes a minute, and then you can list accounts and follow how they perform.
          </p>
          <ol className="mt-8 divide-y divide-line border-y border-line">
            {steps.map(([title, body], i) => (
              <li key={title} className="grid grid-cols-[2rem_1fr] gap-3 py-4">
                <span className="text-mute">{i + 1}</span>
                <div><p className="font-medium">{title}</p><p className="mt-1 text-sm leading-relaxed text-mute">{body}</p></div>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-l-2 border-alert pl-3 text-sm leading-relaxed text-mute">
            Selling a game account breaks Activision&apos;s terms. Sold accounts can be banned or recovered by the original owner.{" "}
            <a href="/legal/risk-disclosure" className="underline underline-offset-4">Read the risks</a>.
          </p>
        </div>
        <section className="h-fit border border-line bg-surface p-6">
          <h2 className="text-lg font-bold">Create your seller profile</h2>
          <div className="mt-5"><SellerRegistrationForm /></div>
        </section>
      </div>
    );
  }

  // 2. Seller: dashboard
  const { data: phoneOk } = await supabase.rpc("seller_phone_verified");
  const [l, o, p] = await Promise.all([
    supabase.from("listings")
      .select("id,title,status,price_cents,previous_price_cents,views,favorites,created_at,moderation_notes,level,mp_rank,platform")
      .eq("seller_id", user.id).order("created_at", { ascending: false }),
    supabase.from("orders").select("id,price_cents,commission_cents,status,created_at,listing_title")
      .eq("seller_id", user.id).order("created_at", { ascending: false }),
    supabase.from("payouts").select("amount_cents,status").eq("seller_id", user.id),
  ]);
  const listings = l.data ?? [];
  const orders = o.data ?? [];
  const payouts = p.data ?? [];
  const loadError = l.error?.message ?? o.error?.message ?? p.error?.message;

  const active = listings.filter((x) => x.status === "active");
  const pending = listings.filter((x) => x.status === "pending_review");
  const rejected = listings.filter((x) => x.status === "rejected");
  const suspended = listings.filter((x) => x.status === "suspended");
  const completed = orders.filter((x) => x.status === "completed");
  const maxViews = Math.max(1, ...listings.map((x) => x.views));
  const net = sum(completed.map((x) => x.price_cents - x.commission_cents));
  const awaiting = sum(payouts.filter((x) => x.status === "pending").map((x) => x.amount_cents));
  const onHold = sum(payouts.filter((x) => x.status === "on_hold").map((x) => x.amount_cents));

  const tiles: [string, string][] = [
    ["Live listings", String(active.length)], ["In review", String(pending.length)],
    ["Total views", String(sum(listings.map((x) => x.views)))], ["Saves", String(sum(listings.map((x) => x.favorites)))],
    ["Value of live listings", money(sum(active.map((x) => x.price_cents)))], ["Completed sales", String(completed.length)],
    ["Net earnings", money(net)], ["Awaiting payout", money(awaiting)],
  ];
  const notice = Object.keys(notices).find((k) => params[k]);
  const verified = profile.seller_verification === "verified";

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller centre</h1>
          <p className="mt-1 text-sm text-mute">Your listings, how they are doing, and what you have earned.</p>
        </div>
        {phoneOk ? (
          <Link href="/sell/new" className="rounded-sm bg-olive px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-dark">List an account</Link>
        ) : (
          <a href="#verify" className="rounded-sm border border-olive px-4 py-2.5 text-sm font-medium text-olive hover:bg-olive hover:text-white">Verify your phone to list</a>
        )}
      </div>
      {!phoneOk && <PhoneVerify phone={seller.phone} />}

      {notice && <p role="status" className="mt-6 border-l-2 border-olive pl-3 text-sm">{notices[notice]}</p>}
      {loadError && <p role="alert" className="mt-6 border-l-2 border-alert pl-3 text-sm text-alert">Some data could not be loaded: {loadError}</p>}

      <section className="mt-8 border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold">{seller.username}</p>
            <p className="mt-1 text-xs text-mute">
              Seller since {date(seller.created_at)}
              {profile.seller_rating ? `, rated ${profile.seller_rating}` : ""}
            </p>
          </div>
          <Badge s={profile.seller_verification} text={verified ? "Verified seller" : profile.seller_verification === "rejected" ? "Verification rejected" : "Awaiting verification"} />
        </div>
        {seller.bio && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mute">{seller.bio}</p>}
        <p className="mt-4 text-xs text-mute">Phone: {seller.phone}, {phoneOk ? "verified" : "not verified yet"}. Only our team sees this.</p>
        <ProfileEditor phone={seller.phone} bio={seller.bio} />
      </section>

      <dl className="mt-6 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        {tiles.map(([k, v]) => (
          <div key={k} className="bg-surface p-4"><dd className="text-xl font-bold">{v}</dd><dt className="mt-1 text-xs text-mute">{k}</dt></div>
        ))}
      </dl>

      {(!verified || rejected.length > 0 || suspended.length > 0 || pending.length > 0 || onHold > 0) && (
        <section className="mt-8">
          <h2 className="mb-3 font-bold">Needs your attention</h2>
          <ul className="divide-y divide-line border border-line bg-surface text-sm">
            {!verified && (
              <li className="px-4 py-3 text-mute">
                {profile.seller_verification === "rejected"
                  ? "Your seller verification was rejected, so payouts are paused. Contact support to appeal."
                  : "Your seller profile is waiting for verification. You can list now, but payouts are released only after you are verified."}
              </li>
            )}
            {rejected.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span><span className="font-medium">{x.title}</span> was rejected: <span className="text-mute">{x.moderation_notes ?? "no reason given"}</span></span>
                <Link href={`/sell/edit/${x.id}`} className="text-olive underline underline-offset-4">Fix and resubmit</Link>
              </li>
            ))}
            {suspended.map((x) => (
              <li key={x.id} className="px-4 py-3"><span className="font-medium">{x.title}</span> was suspended: <span className="text-mute">{x.moderation_notes ?? "contact support for details"}</span></li>
            ))}
            {pending.length > 0 && <li className="px-4 py-3 text-mute">{pending.length} listing{pending.length > 1 ? "s are" : " is"} waiting for review.</li>}
            {onHold > 0 && <li className="px-4 py-3 text-mute">{money(onHold)} in payouts is on hold while an order is checked.</li>}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-bold">Your listings</h2>
        {listings.length === 0 ? (
          <div className="border border-line bg-surface p-8 text-center">
            <p className="font-medium">No listings yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-mute">Your seller profile is ready. List your first account to start reaching buyers.</p>
            <Link href="/sell/new" className="mt-5 inline-block rounded-sm bg-olive px-4 py-2 text-sm font-medium text-white hover:bg-olive-dark">List your first account</Link>
          </div>
        ) : (
          <Table min="62rem">
            <thead><tr><th className={th}>Listing</th><th className={th}>Status</th><th className={th}>Price</th><th className={th}>Views</th>
              <th className={th}>Saves</th><th className={th}>Listed</th><th className={th}>Actions</th></tr></thead>
            <tbody className="divide-y divide-line">
              {listings.map((x) => (
                <tr key={x.id}>
                  <td className={`${td} max-w-xs`}>
                    <p className="font-medium">{x.title}</p>
                    <p className="text-xs text-mute">{x.id}, {x.platform}, level {x.level}, {x.mp_rank}</p>
                    {["rejected", "suspended"].includes(x.status) && x.moderation_notes && <p className="mt-1 text-xs text-alert">{x.moderation_notes}</p>}
                  </td>
                  <td className={td}><Badge s={x.status} text={x.status === "withdrawn" ? "Paused" : undefined} /></td>
                  <td className={td}>
                    <p className="font-medium">{money(x.price_cents)}</p>
                    {x.previous_price_cents && <p className="text-xs text-mute line-through">{money(x.previous_price_cents)}</p>}
                  </td>
                  <td className={`${td} min-w-24`}>
                    {x.views}
                    <div className="mt-1.5 h-1 bg-line"><div className="h-1 bg-olive" style={{ width: `${Math.round((x.views / maxViews) * 100)}%` }} /></div>
                  </td>
                  <td className={td}>{x.favorites}</td>
                  <td className={`${td} text-mute`}>{date(x.created_at)}</td>
                  <td className={td}><ListingActions id={x.id} status={x.status} title={x.title} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-bold">Recent orders</h2>
        {orders.length === 0 ? <Empty>No orders yet. When someone buys one of your accounts it will show up here.</Empty> : (
          <Table min="44rem">
            <thead><tr><th className={th}>Order</th><th className={th}>Listing</th><th className={th}>Sale price</th><th className={th}>You receive</th>
              <th className={th}>Status</th><th className={th}>Date</th></tr></thead>
            <tbody className="divide-y divide-line">
              {orders.slice(0, 8).map((x) => {
                return (
                  <tr key={x.id}>
                    <td className={`${td} font-medium`}><Link href={`/orders/${x.id}`} className="underline underline-offset-4 hover:text-olive">{x.id}</Link></td><td className={td}>{x.listing_title}</td>
                    <td className={td}>{money(x.price_cents)}</td><td className={td}>{money(x.price_cents - x.commission_cents)}</td>
                    <td className={td}><Badge s={x.status} /></td><td className={`${td} text-mute`}>{date(x.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </section>
    </div>
  );
}
