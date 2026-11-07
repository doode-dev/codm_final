"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessage } from "@/app/orders/actions";
import type { ActionResult } from "@/lib/listing-input";

export default function MessageForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(sendMessage.bind(null, orderId), null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);
  return (
    <form ref={form} action={action} className="mt-4 space-y-2">
      {state?.error && <p role="alert" className="text-sm text-alert">{state.error}</p>}
      <textarea name="body" required maxLength={2000} rows={3} aria-label="Message" placeholder="Write a message"
        className="w-full rounded-sm border border-line bg-black px-3 py-2 text-sm" />
      <button disabled={pending} className="rounded-sm bg-olive px-4 py-2 text-sm font-medium text-white hover:bg-olive-dark disabled:opacity-60">
        {pending ? "Sending" : "Send message"}
      </button>
    </form>
  );
}
