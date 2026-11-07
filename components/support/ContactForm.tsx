"use client";

import { useActionState } from "react";
import { submitTicket } from "@/app/contact/actions";
import { SubmitButton, TextField } from "@/components/auth/ui";
import type { ActionResult } from "@/lib/listing-input";
import Area from "@/components/seller/Area";

export default function ContactForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(submitTicket, null);
  if (state?.ok) {
    return (
      <div className="space-y-2">
        <p className="font-medium">Message sent</p>
        <p className="text-sm leading-relaxed text-mute">Thanks. We reply to the email you gave, usually within one working day.</p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      {state?.error && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{state.error}</p>}
      <TextField label="Your email" name="email" type="email" required defaultValue={email} autoComplete="email" />
      <TextField label="Subject" name="subject" required minLength={3} maxLength={120} />
      <TextField label="Order number (optional)" name="order_id" placeholder="O-10001" maxLength={20} />
      <Area label="Message" name="message" rows={6} required minLength={10} maxLength={4000} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <SubmitButton busy={pending}>Send message</SubmitButton>
      <p className="text-xs text-mute">Never put passwords or codes in a message.</p>
    </form>
  );
}
