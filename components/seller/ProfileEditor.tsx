"use client";

import { useActionState } from "react";
import { updateSellerProfile } from "@/app/sell/actions";
import { SubmitButton, TextField } from "@/components/auth/ui";
import type { ActionResult } from "@/lib/listing-input";
import Area from "./Area";

export default function ProfileEditor({ phone, bio }: { phone: string; bio: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(updateSellerProfile, null);
  return (
    <details className="mt-5 border-t border-line pt-4">
      <summary className="cursor-pointer text-sm underline underline-offset-4 hover:text-olive">Edit contact details and bio</summary>
      <form action={action} className="mt-4 max-w-md space-y-4">
        {state?.error && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{state.error}</p>}
        {state?.ok && <p className="text-sm text-mute" aria-live="polite">Saved.</p>}
        <TextField label="Phone number" name="phone" type="tel" defaultValue={phone} required hint="If you change your number you will need to verify the new one before you can list again." />
        <Area label="About you" name="bio" rows={3} maxLength={280} defaultValue={bio} />
        <SubmitButton busy={pending}>Save changes</SubmitButton>
      </form>
    </details>
  );
}
