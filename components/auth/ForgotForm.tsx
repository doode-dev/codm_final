"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isEmail } from "@/lib/validate";
import { SubmitButton, TextField } from "./ui";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) { setError("Enter a valid email address."); return; }
    setError("");
    setBusy(true);
    try {
      await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password` });
      setSent(true); // same message whether or not the account exists
    } catch {
      setError("Could not send the email. Please try again.");
    }
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="space-y-2">
        <p className="font-medium">Check your email</p>
        <p className="text-sm leading-relaxed text-mute">If an account exists for {email}, a reset link is on its way. The link expires after a short time.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoComplete="email" />
      <SubmitButton busy={busy}>Send reset link</SubmitButton>
    </form>
  );
}
