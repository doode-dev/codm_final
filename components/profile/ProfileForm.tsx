"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/profile/actions";
import { countries } from "@/data/site";
import { SelectField, SubmitButton, TextField } from "@/components/auth/ui";
import type { ActionResult } from "@/lib/listing-input";

export default function ProfileForm({ username, country, email }: { username: string; country: string; email: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(updateProfile, null);
  return (
    <form action={action} className="max-w-md space-y-4">
      {state?.error && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{state.error}</p>}
      {state?.ok && <p className="text-sm text-mute" aria-live="polite">Saved.</p>}
      <TextField label="Email" value={email} readOnly disabled hint="To change your email, contact support." />
      <TextField label="Username" name="username" defaultValue={username} required minLength={3} maxLength={24} />
      <SelectField label="Country" name="country" defaultValue={countries.includes(country) ? country : ""} required>
        <option value="">Choose a country</option>
        {countries.map((c) => <option key={c}>{c}</option>)}
      </SelectField>
      <SubmitButton busy={pending}>Save changes</SubmitButton>
    </form>
  );
}
