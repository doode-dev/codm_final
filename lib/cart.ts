import { createClient } from "@/lib/supabase/server";

export type CartItem = {
  id: string; title: string; price: number; level: number; mpRank: string; brRank: string; platform: string; region: string;
  image: string | null; available: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

// The signed-in user's cart with totals. Returns null when nobody is signed in.
// Fees are rounded per account, the same way the database does when it creates the orders.
export async function getCart() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [c, s] = await Promise.all([
    supabase.from("cart_items")
      .select("listing_id, listings(id,title,price_cents,status,level,mp_rank,br_rank,platform,region,media)")
      .eq("user_id", user.id).order("added_at"),
    supabase.from("site_settings").select("value").eq("key", "buyer_fee_pct").maybeSingle(),
  ]);

  const feePct = Number(s.data?.value ?? 5);
  const items: CartItem[] = ((c.data ?? []) as Row[]).map((r) => {
    const l: Row | null = Array.isArray(r.listings) ? r.listings[0] ?? null : r.listings;
    const live = !!l && l.status === "active";
    return {
      id: r.listing_id, title: l?.title ?? "This account", price: live ? l!.price_cents : 0, level: l?.level ?? 0,
      mpRank: l?.mp_rank ?? "", brRank: l?.br_rank ?? "", platform: l?.platform ?? "", region: l?.region ?? "",
      image: l?.media?.[0]?.src ?? null, available: live,
    };
  });
  const ok = items.filter((i) => i.available);
  const subtotal = ok.reduce((n, i) => n + i.price, 0);
  const fee = ok.reduce((n, i) => n + Math.round((i.price * feePct) / 100), 0);
  return { items, feePct, subtotal, fee, total: subtotal + fee, hasUnavailable: items.some((i) => !i.available) };
}
