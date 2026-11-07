import { createClient } from "@supabase/supabase-js";
import { listings as demo, type Listing, type Seller } from "@/data/accounts";
import type { Rank } from "@/data/site";

type Row = {
  id: string; slug: string; title: string; status: Listing["status"]; seller_id: string; featured: boolean; views: number; favorites: number;
  region: string; platform: "Android" | "iOS"; game_version: string | null; level: number; mp_rank: string; mp_ranked_season: string | null; br_rank: string;
  inventory: Partial<Listing["inventory"]> | null; cp: number; credits: number; access: Partial<Listing["access"]> | null;
  proof_provided: boolean; proof_redacted: boolean; media: Listing["media"] | null; price_cents: number; previous_price_cents: number | null;
  currency: string; buyer_fee_pct: number; risk: Partial<Listing["risk"]> | null; verification_status: "attributes_verified" | "seller_declared";
  moderation_notes: string | null; reviewed_at: string | null; created_at: string; updated_at: string;
};
type SellerRow = { id: string; username: string; seller_rating: number | null; completed_sales: number; seller_verification: string; created_at: string };

const emptyCollectibles = { emotes: 0, callingCards: 0, avatars: 0, frames: 0, charms: 0, blueprints: 0 };

function toListing(r: Row, s: SellerRow): Listing {
  const seller: Seller = {
    id: s.id, name: s.username, rating: Number(s.seller_rating ?? 0), completedSales: s.completed_sales,
    joinedAt: s.created_at, verified: s.seller_verification === "verified",
  };
  return {
    id: r.id, slug: r.slug, title: r.title, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
    featured: r.featured, views: r.views, favorites: r.favorites,
    game: { name: "Call of Duty: Mobile", region: r.region, platform: r.platform, version: r.game_version ?? "" },
    progression: { level: r.level, mpRank: r.mp_rank as Rank, mpRankedSeason: r.mp_ranked_season ?? "", brRank: r.br_rank as Rank },
    inventory: {
      mythic: [], legendary: [], operatorSkins: [], weapons: [], ...r.inventory,
      collectibles: { ...emptyCollectibles, ...r.inventory?.collectibles },
    },
    currency: { cp: r.cp, credits: r.credits },
    access: { signInMethod: "", transferLimitations: "", recoveryDependencies: "", ...r.access },
    proofOfOwnership: { provided: r.proof_provided, redacted: r.proof_redacted },
    media: r.media ?? [],
    pricing: { askingPrice: r.price_cents, previousPrice: r.previous_price_cents ?? undefined, currency: r.currency, buyerFeePct: Number(r.buyer_fee_pct) },
    seller,
    risk: {
      knownRestrictions: "None known", previousEnforcement: "None disclosed",
      transferUncertainty: "Account transfers are not recognised by the game publisher. Access may be restricted or recovered by the original owner at any time.",
      ...r.risk,
    },
    moderation: { verificationStatus: r.verification_status, reviewedAt: r.reviewed_at ?? r.created_at, notes: r.moderation_notes ?? "" },
  };
}

// Active listings from Supabase. Uses the public (anon) key, so row level security decides what is visible.
export async function getListings(): Promise<Listing[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return process.env.NODE_ENV === "production" ? [] : demo; // demo data only while developing

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("listings").select("*").eq("status", "active").order("created_at", { ascending: false });
  if (error || !data) {
    console.error("getListings failed:", error?.message);
    return [];
  }
  const rows = data as Row[];
  if (rows.length === 0) return [];

  const { data: sellers, error: sellerError } = await db.from("seller_public").select("*").in("id", [...new Set(rows.map((r) => r.seller_id))]);
  if (sellerError) console.error("seller lookup failed:", sellerError.message);
  const byId = new Map((sellers as SellerRow[] | null ?? []).map((s) => [s.id, s]));
  // A listing whose seller is missing or banned is hidden.
  return rows.flatMap((r) => { const s = byId.get(r.seller_id); return s ? [toListing(r, s)] : []; });
}
