import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingForm, { type ListingInitial } from "@/components/seller/ListingForm";
import { updateListing } from "./actions";

export const metadata = { title: "Edit listing | CODM Accounts" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/sell");

  const { data: row, error } = await supabase.from("listings").select("*").eq("id", id).eq("seller_id", user.id).maybeSingle();
  if (error) { console.error("Fetch listing failed:", error.message); throw new Error("Could not load the listing."); }
  if (!row) notFound();
  if (!["draft", "pending_review", "active", "rejected", "withdrawn", "expired"].includes(row.status)) redirect("/sell");

  const inv = row.inventory ?? {};
  const col = inv.collectibles ?? {};
  const access = row.access ?? {};
  const risk = row.risk ?? {};
  const initial: ListingInitial = {
    title: row.title, region: row.region, platform: row.platform, game_version: row.game_version ?? "", level: row.level,
    mp_rank: row.mp_rank, mp_ranked_season: row.mp_ranked_season ?? "", br_rank: row.br_rank,
    mythic: (inv.mythic ?? []).join(", "), legendary: (inv.legendary ?? []).join(", "), operatorSkins: (inv.operatorSkins ?? []).join(", "),
    weapons: (inv.weapons ?? []).map((w: { name: string; skin: string; rarity: string; upgradeLevel: number }) =>
      `${w.name} | ${w.skin} | ${w.rarity} | ${w.upgradeLevel}`).join("\n"),
    emotes: col.emotes ?? 0, callingCards: col.callingCards ?? 0, avatars: col.avatars ?? 0, frames: col.frames ?? 0, charms: col.charms ?? 0, blueprints: col.blueprints ?? 0,
    cp: row.cp, credits: row.credits,
    signInMethod: access.signInMethod ?? "Activision account", transferLimitations: access.transferLimitations ?? "", recoveryDependencies: access.recoveryDependencies ?? "",
    knownRestrictions: risk.knownRestrictions ?? "", previousEnforcement: risk.previousEnforcement ?? "",
    price: row.price_cents / 100, media: row.media ?? [],
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/sell" className="text-sm text-mute underline underline-offset-4 hover:text-ink">Back to Seller centre</Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Edit listing</h1>
      <p className="mt-2 text-sm text-mute">{row.id}. Changes are reviewed again before the listing goes live.</p>
      {row.status === "rejected" && row.moderation_notes && (
        <p className="mt-4 border-l-2 border-alert pl-3 text-sm leading-relaxed text-mute">
          <span className="text-alert">Why it was rejected:</span> {row.moderation_notes}
        </p>
      )}
      <div className="mt-8">
        <ListingForm action={updateListing.bind(null, id)} initial={initial} editing liveWarning={row.status === "active"} />
      </div>
    </div>
  );
}
