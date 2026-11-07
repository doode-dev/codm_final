"use client";

import { useActionState } from "react";
import { placeOrder } from "@/app/checkout/actions";
import type { ActionResult } from "@/lib/listing-input";

export default function CheckoutForm({ total }: { total: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(placeOrder, null);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{state.error}</p>}
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" name="risk" required className="mt-1 size-4 shrink-0 accent-[var(--color-olive)]" />
        <span>
          I understand that buying a game account breaks Activision&apos;s terms, that the account can be banned or recovered by its original owner,
          and that this site cannot prevent that. <a href="/legal/risk-disclosure" className="underline underline-offset-4">Risk disclosure</a>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" name="terms" required className="mt-1 size-4 shrink-0 accent-[var(--color-olive)]" />
        <span>
          I accept the <a href="/legal/terms" className="underline underline-offset-4">terms</a>,{" "}
          <a href="/legal/buyer-policy" className="underline underline-offset-4">buyer policy</a> and{" "}
          <a href="/legal/refunds" className="underline underline-offset-4">refund and dispute policy</a>.
        </span>
      </label>
      <button disabled={pending} className="w-full rounded-sm bg-olive px-4 py-2.5 font-medium text-white hover:bg-olive-dark disabled:opacity-60">
        {pending ? "Reserving your accounts" : `Place order, ${total}`}
      </button>
      <p className="text-xs text-mute">Placing the order reserves the accounts for you. You pay on the next step.</p>
    </form>
  );
}
