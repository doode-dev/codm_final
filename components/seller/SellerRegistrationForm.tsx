"use client";

import { useActionState } from "react";
import { createSellerProfile } from "@/app/sell/actions";
import { SubmitButton, TextField } from "@/components/auth/ui";
import type { ActionResult } from "@/lib/listing-input";
import Area from "./Area";

export default function SellerRegistrationForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(createSellerProfile, null);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{state.error}</p>}
      <TextField label="Seller name" name="username" required minLength={3} maxLength={24} autoComplete="off"
        hint="Shown on your listings. 3 to 24 letters, numbers or underscores. You can't change it later." />
      <TextField label="Phone number" name="phone" type="tel" required autoComplete="tel"
        hint="With the country code. We text you a code to verify it. Only our team sees this, never buyers." />
      <Area label="About you (optional)" name="bio" rows={3} maxLength={280} hint="Up to 280 characters." />
      <SubmitButton busy={pending}>Create seller profile</SubmitButton>
    </form>
  );
}
