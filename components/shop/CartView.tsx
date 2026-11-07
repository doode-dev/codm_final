"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";
import type { CartItem } from "@/lib/cart";
import { useShop } from "./ShopProvider";

export default function CartView({ items, feePct, subtotal, fee, total, hasUnavailable }: {
  items: CartItem[]; feePct: number; subtotal: number; fee: number; total: number; hasUnavailable: boolean;
}) {
  const { removeFromCart } = useShop();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const remove = (id: string) => start(async () => { setError(""); const r = await removeFromCart(id); if (r) setError(r); else router.refresh(); });

  if (items.length === 0) {
    return (
      <div className="border border-line bg-surface p-10 text-center">
        <p className="font-medium">Your cart is empty</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-mute">Find an account you like and press Add to cart. You can hold up to 10.</p>
        <Link href="/accounts" className="mt-5 inline-block rounded-sm bg-olive px-4 py-2 text-sm font-medium text-white hover:bg-olive-dark">Browse accounts</Link>
      </div>
    );
  }
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        {error && <p role="alert" className="mb-4 border-l-2 border-alert pl-3 text-sm text-alert">{error}</p>}
        <ul className="divide-y divide-line border border-line bg-surface">
          {items.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className={`font-medium ${i.available ? "" : "text-mute line-through"}`}>{i.title}</p>
                <p className="mt-1 text-xs text-mute">
                  {i.available ? `${i.id}, ${i.platform}, ${i.region}, level ${i.level}, multiplayer ${i.mpRank}` : "No longer available. Remove it to continue."}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {i.available && <span className="font-bold">{money(i.price)}</span>}
                <button disabled={pending} onClick={() => remove(i.id)} className="text-xs text-mute underline underline-offset-4 hover:text-alert disabled:opacity-50">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit space-y-4 border border-line bg-surface p-5 text-sm">
        <h2 className="font-bold">Order summary</h2>
        <dl className="space-y-2">
          <div className="flex justify-between"><dt className="text-mute">Accounts</dt><dd>{money(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-mute">Service fee ({feePct}%)</dt><dd>{money(fee)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd>{money(total)}</dd></div>
        </dl>
        {hasUnavailable ? (
          <p className="text-xs text-alert">Remove the unavailable accounts to check out.</p>
        ) : (
          <Link href="/checkout" className="block rounded-sm bg-olive px-4 py-2.5 text-center font-medium text-white hover:bg-olive-dark">Go to checkout</Link>
        )}
        <Link href="/accounts" className="block text-center text-xs text-mute underline underline-offset-4 hover:text-ink">Keep browsing</Link>
      </aside>
    </div>
  );
}
