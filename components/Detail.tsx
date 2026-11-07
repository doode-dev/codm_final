"use client";

import { useEffect, useRef } from "react";
import type { Listing } from "@/data/accounts";
import { date, money } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { AddToCartButton, BuyNowButton, ReportButton, SaveButton } from "@/components/shop/Buttons";

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-t border-line pt-4"><h3 className="mb-2 font-bold">{title}</h3>{children}</section>;
}
const Pair = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-1 text-sm"><dt className="text-mute">{k}</dt><dd className="text-right">{v}</dd></div>
);
const names = (a: string[]) => (a.length ? a.join(", ") : "None");

export default function Detail({ l, onClose }: { l: Listing | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (l && !d.open) d.showModal();
    if (!l && d.open) d.close();
  }, [l]);

  useEffect(() => {
    if (!l) return;
    try {
      const seen = JSON.parse(sessionStorage.getItem("seenListings") ?? "[]") as string[];
      if (seen.includes(l.id)) return; // count each listing once per visit
      sessionStorage.setItem("seenListings", JSON.stringify([...seen, l.id]));
      createClient().rpc("record_listing_view", { listing: l.id }).then(() => {});
    } catch { /* Supabase isn't configured, or storage is blocked */ }
  }, [l]);

  const fee = l ? Math.round((l.pricing.askingPrice * l.pricing.buyerFeePct) / 100) : 0;
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(44rem,calc(100%-1.5rem))] rounded-sm bg-surface p-0 text-ink">
      {l && (
        <div className="max-h-[88vh] space-y-5 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold leading-snug">{l.title}</h2>
              <p className="mt-1 text-sm text-mute">{l.id} · Listed {date(l.createdAt)} · {l.moderation.verificationStatus === "attributes_verified" ? "Attributes verified" : "Seller-declared"}</p>
            </div>
            <button onClick={onClose} className="rounded-sm border border-line px-2.5 py-1 text-sm hover:border-ink">Close</button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {l.media.map((m) => (
              <figure key={m.src}>
                <div className="flex aspect-video items-center justify-center rounded-sm bg-paper text-xs text-mute">Screenshot</div>
                <figcaption className="mt-1 text-xs text-mute">{m.caption}</figcaption>
              </figure>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-[1fr_15rem]">
            <div className="space-y-5">
              <Part title="Progression"><dl>
                <Pair k="Level" v={l.progression.level} />
                <Pair k="Multiplayer rank" v={`${l.progression.mpRank} (${l.progression.mpRankedSeason})`} />
                <Pair k="Battle royale rank" v={l.progression.brRank} />
                <Pair k="Platform and region" v={`${l.game.platform}, ${l.game.region}`} />
                <Pair k="Game version" v={l.game.version} />
              </dl></Part>
              <Part title="Inventory"><dl>
                <Pair k={`Mythic (${l.inventory.mythic.length})`} v={names(l.inventory.mythic)} />
                <Pair k={`Legendary (${l.inventory.legendary.length})`} v={names(l.inventory.legendary)} />
                <Pair k="Operator skins" v={names(l.inventory.operatorSkins)} />
              </dl>
                <p className="mt-3 text-sm text-mute">Featured weapons</p>
                <ul className="mt-1 text-sm">{l.inventory.weapons.map((w) => (
                  <li key={w.name + w.skin} className="flex justify-between gap-4 py-0.5"><span>{w.name}, {w.skin} ({w.rarity})</span><span className="text-mute">Upgrade {w.upgradeLevel}</span></li>
                ))}</ul>
                <p className="mt-3 text-sm text-mute">
                  {Object.entries(l.inventory.collectibles).map(([k, v]) => `${v} ${k.replace(/([A-Z])/g, " $1").toLowerCase()}`).join(", ")}
                </p>
              </Part>
              <Part title="Currency"><dl>
                <Pair k="COD Points" v={l.currency.cp.toLocaleString()} /><Pair k="Credits" v={l.currency.credits.toLocaleString()} />
              </dl></Part>
              <Part title="Access and ownership"><dl>
                <Pair k="Sign-in method" v={l.access.signInMethod} />
                <Pair k="Recovery dependency" v={l.access.recoveryDependencies} />
                <Pair k="Transfer limits" v={l.access.transferLimitations} />
                <Pair k="Proof of ownership" v={l.proofOfOwnership.provided ? "Provided, redacted" : "Not provided"} />
              </dl></Part>
              <Part title="Risk disclosure"><dl>
                <Pair k="Known restrictions" v={l.risk.knownRestrictions} />
                <Pair k="Previous enforcement" v={l.risk.previousEnforcement} />
              </dl>
                <p className="mt-2 border-l-2 border-alert pl-3 text-sm text-mute">{l.risk.transferUncertainty}</p>
              </Part>
            </div>

            <aside className="h-fit space-y-4 border border-line p-4 text-sm">
              <div>
                <p className="text-2xl font-bold">{money(l.pricing.askingPrice)}</p>
                {l.pricing.previousPrice && <p className="text-mute line-through">{money(l.pricing.previousPrice)}</p>}
              </div>
              <dl>
                <Pair k="Buyer fee (5%)" v={money(fee)} />
                <Pair k="Total" v={<strong>{money(l.pricing.askingPrice + fee)}</strong>} />
              </dl>
              <BuyNowButton id={l.id} />
              <AddToCartButton id={l.id} />
              <SaveButton id={l.id} />
              <div className="border-t border-line pt-3">
                <p className="font-medium">{l.seller.name}</p>
                <p className="text-mute">{l.seller.rating} rating, {l.seller.completedSales} sales</p>
                <p className="text-mute">Joined {date(l.seller.joinedAt)}{l.seller.verified ? ", verified" : ""}</p>
              </div>
              <ReportButton listingId={l.id} />
            </aside>
          </div>
        </div>
      )}
    </dialog>
  );
}
