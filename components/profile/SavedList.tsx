"use client";

import { useRouter } from "next/navigation";
import { money } from "@/lib/format";
import { AddToCartButton } from "@/components/shop/Buttons";
import { useShop } from "@/components/shop/ShopProvider";

export type SavedItem = { id: string; title: string; price: number; level: number; mpRank: string; platform: string };

export default function SavedList({ items }: { items: SavedItem[] }) {
  const { toggleSaved } = useShop();
  const router = useRouter();
  if (items.length === 0) return <p className="text-sm text-mute">Nothing saved yet. Press &ldquo;Save for later&rdquo; on an account to keep it here.</p>;
  return (
    <ul className="divide-y divide-line border border-line bg-surface">
      {items.map((i) => (
        <li key={i.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="font-medium">{i.title}</p>
            <p className="mt-1 text-xs text-mute">{i.id}, {i.platform}, level {i.level}, multiplayer {i.mpRank}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold">{money(i.price)}</span>
            <div className="w-36"><AddToCartButton id={i.id} /></div>
            <button className="text-xs text-mute underline underline-offset-4 hover:text-alert" onClick={async () => { await toggleSaved(i.id); router.refresh(); }}>Remove</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
