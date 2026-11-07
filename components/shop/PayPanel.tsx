"use client";

import { useState, useTransition } from "react";
import { payOrders, startPaystack } from "@/app/checkout/pay/actions";

export default function PayPanel({ ids, total, charge, mode, instructions, expires }: {
  ids: string[]; total: string; charge: string; mode: "paystack" | "test" | "manual"; instructions: string; expires: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const run = (fn: (ids: string[]) => Promise<{ error?: string } | null | undefined>) =>
    start(async () => { setError(""); const r = await fn(ids); if (r?.error) setError(r.error); });
  const err = error && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{error}</p>;
  const btn = "w-full rounded-sm bg-olive px-4 py-2.5 font-medium text-white hover:bg-olive-dark disabled:opacity-60";

  return (
    <div className="space-y-4">
      <p className="text-sm text-mute">Your accounts are reserved until {expires}. After that the order is cancelled and they go back on sale.</p>
      {mode === "paystack" && (
        <>
          {charge !== total && <p className="text-sm text-mute">You will be charged <span className="font-medium text-ink">{charge}</span> (the dollar total converted).</p>}
          {err}
          <button disabled={pending} onClick={() => run(startPaystack)} className={btn}>{pending ? "Taking you to Paystack" : `Pay ${charge} with Paystack`}</button>
          <p className="text-xs leading-relaxed text-mute">You pay on Paystack&apos;s secure page by card, mobile money or bank. We never see your card details. Your money is held until you confirm the account.</p>
        </>
      )}
      {mode === "test" && (
        <>
          <p className="border-l-2 border-olive pl-3 text-sm leading-relaxed text-mute">Test mode. No real money moves. This button only exists while you develop.</p>
          {err}
          <button disabled={pending} onClick={() => run(payOrders)} className={btn}>{pending ? "Processing" : `Pay ${total} (test)`}</button>
        </>
      )}
      {mode === "manual" && (
        <div className="space-y-3 border border-line bg-black p-4 text-sm leading-relaxed">
          <p className="font-medium">How to pay</p>
          <p className="whitespace-pre-line text-mute">{instructions}</p>
          <p>Amount to pay: <span className="font-bold">{total}</span></p>
          <p>Order reference: <span className="font-bold">{ids.join(", ")}</span></p>
          <p className="text-xs text-mute">When we confirm your payment, the order moves to &ldquo;Paid&rdquo; and the seller delivers the account.</p>
        </div>
      )}
    </div>
  );
}
