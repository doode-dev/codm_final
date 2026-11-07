"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { money } from "@/lib/format";
import { useAdmin } from "./store";
import { btn, btnDanger, btnPrimary } from "./ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const list = (a?: string[]) => (a && a.length ? a.join(", ") : "None");

// Everything an admin needs to decide: screenshots, inventory, access details, risks and the seller's checks.
export default function ListingReview({ id, onClose, onReject }: { id: string | null; onClose: () => void; onReject: (id: string) => void }) {
  const { users, approveListing } = useAdmin();
  const ref = useRef<HTMLDialogElement>(null);
  const [row, setRow] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!id) { if (d.open) d.close(); return; }
    setRow(null); setError(""); setVerified(false);
    if (!d.open) d.showModal();
    createClient().from("listings").select("*").eq("id", id).single().then(({ data, error: e }) => (e ? setError(e.message) : setRow(data)));
  }, [id]);

  const seller = users.find((u) => u.id === row?.seller_id);
  const inv = row?.inventory ?? {};
  const col = inv.collectibles ?? {};
  const access = row?.access ?? {};
  const risk = row?.risk ?? {};

  return (
    <dialog ref={ref} onClose={onClose} className="m-auto w-[min(52rem,calc(100%-1.5rem))] rounded-sm bg-surface p-0 text-ink">
      <div className="max-h-[88vh] space-y-5 overflow-y-auto p-6 text-sm">
        {error && <p role="alert" className="text-alert">{error}</p>}
        {!row && !error && <p className="text-mute">Loading</p>}
        {row && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-lg font-bold">{row.title}</h2><p className="text-xs text-mute">{row.id}, asking {money(row.price_cents)}</p></div>
              <button onClick={onClose} className={btn}>Close</button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {(row.media ?? []).map((m: { src: string; caption: string }) => (
                <a key={m.src} href={m.src} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.src} alt={m.caption} className="aspect-video w-full bg-black object-cover" />
                  <span className="mt-1 block text-xs text-mute">{m.caption}</span>
                </a>
              ))}
              {(row.media ?? []).length === 0 && <p className="text-alert sm:col-span-3">No screenshots. Do not approve.</p>}
            </div>

            <dl className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              {([
                ["Platform and region", `${row.platform}, ${row.region}`], ["Level", row.level],
                ["Multiplayer rank", `${row.mp_rank} (${row.mp_ranked_season ?? "season not stated"})`], ["Battle royale rank", row.br_rank],
                ["Mythic items", list(inv.mythic)], ["Legendary items", list(inv.legendary)], ["Operator skins", list(inv.operatorSkins)],
                ["Collectibles", Object.entries(col).map(([k, v]) => `${v} ${k}`).join(", ") || "None"],
                ["COD Points / Credits", `${row.cp} / ${row.credits}`],
                ["Sign-in method", access.signInMethod], ["Linked to", access.recoveryDependencies], ["Transfer limits", access.transferLimitations],
                ["Known restrictions", risk.knownRestrictions], ["Previous enforcement", risk.previousEnforcement],
              ] as [string, string | number][]).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-1"><dt className="text-mute">{k}</dt><dd className="text-right">{v}</dd></div>
              ))}
            </dl>

            <div className="border-t border-line pt-4">
              <p className="font-medium">Seller</p>
              <p className="mt-1 text-xs text-mute">
                {seller ? `${seller.username}, verification: ${seller.sellerVerification}, phone: ${seller.phone ?? "none"} ${seller.phoneVerified ? "(verified)" : "(NOT verified)"}, completed sales: ${seller.sales}` : "Seller details unavailable"}
              </p>
            </div>

            <div className="space-y-3 border-t border-line pt-4">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="mt-1 size-4 accent-[var(--color-olive)]" />
                <span>I checked the screenshots and the level, ranks and items match. Mark the attributes as verified.</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button className={btnPrimary} onClick={() => { approveListing(row.id, verified); onClose(); }}>Approve listing</button>
                <button className={btnDanger} onClick={() => { onReject(row.id); onClose(); }}>Reject with a reason</button>
              </div>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
