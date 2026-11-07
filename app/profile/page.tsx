import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileForm from "@/components/profile/ProfileForm";
import PasswordForm from "@/components/profile/PasswordForm";
import SavedList, { type SavedItem } from "@/components/profile/SavedList";
import { Badge } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { date, money } from "@/lib/format";

export const metadata = { title: "Profile | CODM Accounts" };
const roleLabel: Record<string, string> = { buyer: "Buyer", seller: "Seller", both: "Buyer and seller", admin: "Admin" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/profile");

  const [p, o, f] = await Promise.all([
    supabase.from("profiles").select("username,country,role,status,seller_verification,created_at").eq("id", user.id).single(),
    supabase.from("orders").select("id,listing_title,total_cents,status,created_at").eq("buyer_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("favorites").select("listing_id, listings(id,title,price_cents,level,mp_rank,platform,status)").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  const profile = p.data;
  if (!profile || profile.status !== "active") redirect("/");

  const saved: SavedItem[] = ((f.data ?? []) as Row[]).flatMap((r) => {
    const l: Row | null = Array.isArray(r.listings) ? r.listings[0] ?? null : r.listings;
    return l && l.status === "active" ? [{ id: l.id, title: l.title, price: l.price_cents, level: l.level, mpRank: l.mp_rank, platform: l.platform }] : [];
  });
  const orders = o.data ?? [];
  const sells = profile.role === "seller" || profile.role === "both";
  const h2 = "mb-4 text-lg font-bold";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl space-y-12 px-5 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{profile.username}</h1>
          <p className="mt-1 text-sm text-mute">{roleLabel[profile.role] ?? profile.role}, member since {date(profile.created_at)}</p>
        </div>

        <section>
          <h2 className={h2}>Account details</h2>
          <ProfileForm username={profile.username} country={profile.country ?? ""} email={user.email ?? ""} />
        </section>

        {profile.role !== "admin" && (
          <section>
            <h2 className={h2}>Selling</h2>
            {sells ? (
              <p className="text-sm text-mute">
                Seller check: <Badge s={profile.seller_verification} text={profile.seller_verification === "verified" ? "Verified" : profile.seller_verification === "rejected" ? "Rejected" : "Awaiting verification"} />{" "}
                <Link href="/sell" className="ml-2 text-olive underline underline-offset-4">Open the Seller centre</Link>
              </p>
            ) : (
              <p className="text-sm text-mute">
                You are signed up as a buyer. <Link href="/sell" className="text-olive underline underline-offset-4">Create a seller profile</Link> to start listing accounts.
              </p>
            )}
          </section>
        )}

        <section>
          <div className="mb-4 flex items-baseline justify-between"><h2 className="text-lg font-bold">Recent orders</h2>
            <Link href="/orders" className="text-sm text-mute underline underline-offset-4 hover:text-ink">All orders</Link></div>
          {orders.length === 0 ? <p className="text-sm text-mute">No orders yet.</p> : (
            <ul className="divide-y divide-line border border-line bg-surface text-sm">
              {orders.map((x) => (
                <li key={x.id}>
                  <Link href={`/orders/${x.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-black">
                    <span><span className="font-medium">{x.id}</span> <span className="text-mute">{x.listing_title}</span></span>
                    <span className="flex items-center gap-3"><span>{money(x.total_cents)}</span><Badge s={x.status} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section><h2 className={h2}>Saved accounts</h2><SavedList items={saved} /></section>
        <section><h2 className={h2}>Change password</h2><PasswordForm /></section>
      </main>
      <Footer />
    </>
  );
}
