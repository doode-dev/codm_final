"use client";

import { useMemo, useState } from "react";
import type { Listing } from "@/data/accounts";
import { ranks, type Rank } from "@/data/site";
import Row from "./ListingRow";
import Detail from "./Detail";

type Sort = "recommended" | "newest" | "price-asc" | "price-desc" | "views" | "favorites";
type Filters = {
  q: string; mpRank: "any" | Rank; brRank: "any" | Rank; minPrice: string; maxPrice: string;
  minMythic: number; minLegendary: number; platform: "any" | "Android" | "iOS"; verifiedOnly: boolean; sort: Sort;
};
const empty: Filters = { q: "", mpRank: "any", brRank: "any", minPrice: "", maxPrice: "", minMythic: 0, minLegendary: 0, platform: "any", verifiedOnly: false, sort: "recommended" };

const field = "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm";
const rankOk = (have: Rank, min: "any" | Rank) => min === "any" || ranks.indexOf(have) >= ranks.indexOf(min);
const searchText = (l: Listing) =>
  [l.title, l.id, ...l.inventory.mythic, ...l.inventory.legendary, ...l.inventory.operatorSkins,
   ...l.inventory.weapons.map((w) => `${w.name} ${w.skin}`)].join(" ").toLowerCase();

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm"><span className="mb-1 block text-mute">{label}</span>{children}</label>;
}

export default function AccountBrowser({ listings }: { listings: Listing[] }) {
  const [f, setF] = useState<Filters>(empty);
  const [open, setOpen] = useState<Listing | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((p) => ({ ...p, [k]: v }));

  const results = useMemo(() => {
    const min = f.minPrice ? Number(f.minPrice) * 100 : 0;
    const max = f.maxPrice ? Number(f.maxPrice) * 100 : Infinity;
    const out = listings.filter((l) =>
      l.status === "active" &&
      (!f.q || searchText(l).includes(f.q.toLowerCase())) &&
      rankOk(l.progression.mpRank, f.mpRank) && rankOk(l.progression.brRank, f.brRank) &&
      l.pricing.askingPrice >= min && l.pricing.askingPrice <= max &&
      l.inventory.mythic.length >= f.minMythic && l.inventory.legendary.length >= f.minLegendary &&
      (f.platform === "any" || l.game.platform === f.platform) &&
      (!f.verifiedOnly || l.moderation.verificationStatus === "attributes_verified"));
    const by: Record<Sort, (a: Listing, b: Listing) => number> = {
      recommended: (a, b) => Number(b.featured) - Number(a.featured) || b.views - a.views,
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      "price-asc": (a, b) => a.pricing.askingPrice - b.pricing.askingPrice,
      "price-desc": (a, b) => b.pricing.askingPrice - a.pricing.askingPrice,
      views: (a, b) => b.views - a.views,
      favorites: (a, b) => b.favorites - a.favorites,
    };
    return [...out].sort(by[f.sort]);
  }, [f, listings]);

  const rankSelect = (k: "mpRank" | "brRank") => (
    <select className={field} value={f[k]} onChange={(e) => set(k, e.target.value as Filters[typeof k])}>
      <option value="any">Any</option>{ranks.map((r) => <option key={r}>{r}</option>)}
    </select>
  );
  const countSelect = (k: "minMythic" | "minLegendary") => (
    <select className={field} value={f[k]} onChange={(e) => set(k, Number(e.target.value))}>
      <option value={0}>Any</option><option value={1}>1 or more</option><option value={3}>3 or more</option><option value={5}>5 or more</option>
    </select>
  );

  return (
    <>
      <section id="browse" className="mx-auto grid max-w-6xl gap-8 px-5 pb-12 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div>
          <button onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}
            className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm lg:hidden">
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
          <aside aria-label="Filters"
            className={`${showFilters ? "block" : "hidden"} mt-3 space-y-4 lg:sticky lg:top-4 lg:mt-0 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:border lg:border-line lg:bg-surface lg:p-4`}>
            <div className="flex items-baseline justify-between">
              <h2 className="font-bold">Filters</h2>
              <button onClick={() => setF(empty)} className="text-sm text-mute underline underline-offset-4">Reset</button>
            </div>
            <Field label="Search"><input className={field} placeholder="Skin, weapon or ID" value={f.q} onChange={(e) => set("q", e.target.value)} /></Field>
            <Field label="Sort by">
              <select className={field} value={f.sort} onChange={(e) => set("sort", e.target.value as Sort)}>
                <option value="recommended">Recommended</option><option value="newest">Newest first</option>
                <option value="price-asc">Price, low to high</option><option value="price-desc">Price, high to low</option>
                <option value="views">Most viewed</option><option value="favorites">Most favorited</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Min price ($)"><input className={field} inputMode="numeric" placeholder="0" value={f.minPrice} onChange={(e) => set("minPrice", e.target.value.replace(/\D/g, ""))} /></Field>
              <Field label="Max price ($)"><input className={field} inputMode="numeric" placeholder="Any" value={f.maxPrice} onChange={(e) => set("maxPrice", e.target.value.replace(/\D/g, ""))} /></Field>
            </div>
            <Field label="Multiplayer rank, at least">{rankSelect("mpRank")}</Field>
            <Field label="Battle royale rank, at least">{rankSelect("brRank")}</Field>
            <Field label="Mythic items">{countSelect("minMythic")}</Field>
            <Field label="Legendary items">{countSelect("minLegendary")}</Field>
            <Field label="Platform">
              <select className={field} value={f.platform} onChange={(e) => set("platform", e.target.value as Filters["platform"])}>
                <option value="any">Any</option><option>Android</option><option>iOS</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-[var(--color-olive)]" checked={f.verifiedOnly} onChange={(e) => set("verifiedOnly", e.target.checked)} />
              Verified attributes only
            </label>
          </aside>
        </div>

        <div>
          <p className="mb-4 text-sm text-mute" aria-live="polite">{results.length} {results.length === 1 ? "account" : "accounts"}</p>
          {results.length === 0 ? (
            <p className="border border-line bg-surface p-6 text-sm text-mute">No accounts match these filters. Raise the price limit or reset the filters.</p>
          ) : (
            <ul className="space-y-3">
              {results.map((l) => <Row key={l.id} l={l} onOpen={setOpen} />)}
            </ul>
          )}
        </div>
      </section>

      <Detail l={open} onClose={() => setOpen(null)} />
    </>
  );
}
