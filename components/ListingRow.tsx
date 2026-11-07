"use client";

import { useState } from "react";
import type { Listing } from "@/data/accounts";
import { date, money } from "@/lib/format";
import { AddToCartButton } from "@/components/shop/Buttons";

export default function Row({ l, onOpen }: { l: Listing; onOpen: (l: Listing) => void }) {
  const [broken, setBroken] = useState(false);
  const p = l.pricing;
  const drop = p.previousPrice ? Math.round((1 - p.askingPrice / p.previousPrice) * 100) : 0;
  const fee = Math.round((p.askingPrice * p.buyerFeePct) / 100);
  const items = [...l.inventory.mythic.map((n) => ({ n, mythic: true })), ...l.inventory.legendary.map((n) => ({ n, mythic: false }))];
  const shown = items.slice(0, 4);
  const more = items.length - shown.length;
  const verified = l.moderation.verificationStatus === "attributes_verified";
  const specs: [string, string | number][] = [
    ["Level", l.progression.level], ["Multiplayer", l.progression.mpRank], ["Battle royale", l.progression.brRank],
    ["Mythic", l.inventory.mythic.length], ["Legendary", l.inventory.legendary.length],
  ];
  const tag = "rounded-sm px-2 py-0.5 text-xs font-medium";

  return (
    <li>
      <article className={`relative grid overflow-hidden rounded-sm border bg-surface transition-colors hover:border-olive md:grid-cols-[13rem_minmax(0,1fr)_12.5rem] ${l.featured ? "border-olive/60" : "border-line"}`}>
        <div className="relative aspect-[16/10] bg-black md:aspect-auto md:min-h-full">
          {broken ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-olive">{l.progression.level}</span>
              <span className="text-sm text-mute">Level</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.media[0].src} alt="" loading="lazy" onError={() => setBroken(true)} className="absolute inset-0 h-full w-full object-cover" />
          )}
          {l.featured && <span className={`${tag} absolute left-3 top-3 bg-olive text-white`}>Featured</span>}
        </div>

        <div className="flex min-w-0 flex-col gap-4 p-5">
          <div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
              <span>{l.id}</span>
              <span>{l.game.platform}, {l.game.region}</span>
              {verified && <span className="rounded-sm border border-line px-1.5 py-0.5 text-ink">Verified attributes</span>}
              <span>Listed {date(l.createdAt)}</span>
            </p>
            <h3 className="mt-2">
              <button onClick={() => onOpen(l)} className="text-left text-lg font-bold leading-snug after:absolute after:inset-0">{l.title}</button>
            </h3>
          </div>

          <dl className="grid grid-cols-3 gap-px bg-line sm:grid-cols-5">
            {specs.map(([k, v]) => (
              <div key={k} className="bg-surface py-1.5 pr-3 sm:px-3 sm:first:pl-0">
                <dd className="text-sm font-bold sm:text-base">{v}</dd>
                <dt className="text-xs text-mute">{k}</dt>
              </div>
            ))}
          </dl>

          <ul className="flex flex-wrap items-center gap-1.5 text-xs">
            {shown.map((it) => (
              <li key={it.n} className={`rounded-sm border px-2 py-1 ${it.mythic ? "border-olive text-olive" : "border-line text-mute"}`}>{it.n}</li>
            ))}
            {more > 0 && <li className="px-1 text-mute">+{more} more</li>}
            {items.length === 0 && <li className="text-mute">No mythic or legendary items</li>}
          </ul>
        </div>

        <div className="flex flex-col justify-between gap-5 border-t border-line p-5 md:border-l md:border-t-0">
          <div>
            <div className="flex items-baseline gap-2 md:block">
              <p className="text-3xl font-bold leading-none">{money(p.askingPrice)}</p>
              {p.previousPrice && (
                <p className="text-sm text-mute md:mt-1.5">
                  <span className="line-through">{money(p.previousPrice)}</span>
                  <span className="ml-2 text-alert">{drop}% off</span>
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-mute">{money(p.askingPrice + fee)} with buyer fee</p>
          </div>
          <div>
            <p className="text-sm font-medium">{l.seller.name}</p>
            <p className="text-xs text-mute">{l.seller.rating} rating, {l.seller.completedSales} sales</p>
            <p className="mt-0.5 text-xs text-mute">{l.views} views, {l.favorites} saved</p>
            <div className="mt-3 space-y-2">
              <span aria-hidden className="block rounded-sm bg-olive px-4 py-2 text-center text-sm font-medium text-white">View account</span>
              <div className="relative z-10"><AddToCartButton id={l.id} /></div>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}
