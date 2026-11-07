"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cancelOrder, confirmOrder, openDispute } from "@/app/orders/actions";
import type { ActionResult } from "@/lib/listing-input";

const btn = "rounded-sm px-4 py-2 text-sm font-medium disabled:opacity-60";

export default function OrderActions({ id, status, canDispute }: { id: string; status: string; canDispute: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => { setError(""); const r = await fn(); if (r?.error) setError(r.error); else after?.(); });

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {status === "awaiting_payment" && (
          <>
            <Link href={`/checkout/pay?orders=${id}`} className={`${btn} bg-olive text-white hover:bg-olive-dark`}>Complete payment</Link>
            <button disabled={pending} onClick={() => run(() => cancelOrder(id))} className={`${btn} border border-line hover:border-ink`}>Cancel order</button>
          </>
        )}
        {["paid", "under_review"].includes(status) && (
          <button disabled={pending} className={`${btn} bg-olive text-white hover:bg-olive-dark`}
            onClick={() => { if (confirm("Confirm only when you can sign in and the account matches the listing. This releases the money to the seller.")) run(() => confirmOrder(id)); }}>
            I received the account
          </button>
        )}
        {canDispute && !reporting && (
          <button onClick={() => setReporting(true)} className={`${btn} border border-alert text-alert hover:bg-alert hover:text-white`}>Report a problem</button>
        )}
      </div>
      {reporting && (
        <form className="space-y-3 border border-line bg-black p-4" onSubmit={(e) => { e.preventDefault(); run(() => openDispute(id, reason), () => setReporting(false)); }}>
          <label className="block text-sm"><span className="mb-1 block text-mute">What is wrong?</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} required minLength={10} maxLength={2000}
              placeholder="For example: the account is level 98 but the listing said level 120." className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm" />
          </label>
          <p className="text-xs text-mute">Our team reviews the order and the chat, then refunds you or releases the money to the seller. Money is held until then.</p>
          <div className="flex gap-2">
            <button disabled={pending} className={`${btn} bg-olive text-white hover:bg-olive-dark`}>Open dispute</button>
            <button type="button" onClick={() => setReporting(false)} className={`${btn} border border-line`}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
