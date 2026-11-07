"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useShop } from "./ShopProvider";

const base = "rounded-sm px-4 py-2 text-sm font-medium disabled:opacity-60";

function useGo() {
  const router = useRouter();
  const path = usePathname();
  return (r: string | null, setErr: (m: string) => void, then?: () => void) => {
    if (r === "login") router.push(`/auth/login?next=${encodeURIComponent(path)}`);
    else if (r) setErr(r);
    else then?.();
  };
}

export function AddToCartButton({ id, full = true }: { id: string; full?: boolean }) {
  const { cart, addToCart } = useShop();
  const go = useGo();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const w = full ? "w-full text-center" : "";
  if (cart.includes(id)) return <Link href="/cart" className={`${base} ${w} block border border-line hover:border-ink`}>In your cart, view</Link>;
  return (
    <div>
      <button disabled={busy} className={`${base} ${w} border border-olive text-olive hover:bg-olive hover:text-white`}
        onClick={async () => { setBusy(true); setErr(""); go(await addToCart(id), setErr); setBusy(false); }}>Add to cart</button>
      {err && <p role="alert" className="mt-1 text-xs text-alert">{err}</p>}
    </div>
  );
}

export function BuyNowButton({ id }: { id: string }) {
  const { addToCart } = useShop();
  const router = useRouter();
  const go = useGo();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div>
      <button disabled={busy} className={`${base} w-full bg-olive text-white hover:bg-olive-dark`}
        onClick={async () => { setBusy(true); setErr(""); go(await addToCart(id), setErr, () => router.push("/checkout")); setBusy(false); }}>Buy now</button>
      {err && <p role="alert" className="mt-1 text-xs text-alert">{err}</p>}
    </div>
  );
}

export function SaveButton({ id }: { id: string }) {
  const { saved, toggleSaved } = useShop();
  const go = useGo();
  const [err, setErr] = useState("");
  const on = saved.includes(id);
  return (
    <div>
      <button className={`${base} w-full border border-line hover:border-ink`} aria-pressed={on}
        onClick={async () => { setErr(""); go(await toggleSaved(id), setErr); }}>{on ? "Saved" : "Save for later"}</button>
      {err && <p role="alert" className="mt-1 text-xs text-alert">{err}</p>}
    </div>
  );
}

export function ReportButton({ listingId }: { listingId: string }) {
  const { uid } = useShop();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");

  if (state === "done") return <p className="text-xs text-mute" aria-live="polite">Thanks. Our team will look at this listing.</p>;
  if (!open) {
    return <button className="text-mute underline underline-offset-4" onClick={() => (uid ? setOpen(true) : router.push(`/auth/login?next=${encodeURIComponent(path)}`))}>Report this listing</button>;
  }
  return (
    <form className="space-y-2" onSubmit={async (e) => {
      e.preventDefault();
      if (reason.trim().length < 5) { setErr("Tell us what is wrong, in at least 5 characters."); return; }
      setState("busy"); setErr("");
      const { error } = await createClient().from("reports").insert({ target_type: "listing", target_id: listingId, reporter_id: uid, reason: reason.trim() });
      if (error) { setErr("Could not send the report. Please try again."); setState("idle"); } else setState("done");
    }}>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={1000} aria-label="What is wrong with this listing?"
        placeholder="What is wrong with this listing?" className="w-full rounded-sm border border-line bg-black px-2 py-1.5 text-xs" />
      {err && <p role="alert" className="text-xs text-alert">{err}</p>}
      <div className="flex gap-2">
        <button disabled={state === "busy"} className="rounded-sm border border-alert px-2.5 py-1 text-xs text-alert hover:bg-alert hover:text-white">Send report</button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-mute underline underline-offset-4">Cancel</button>
      </div>
    </form>
  );
}
