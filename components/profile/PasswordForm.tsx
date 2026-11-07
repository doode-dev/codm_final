"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { passwordOk } from "@/lib/validate";
import { PasswordField, SubmitButton } from "@/components/auth/ui";

export default function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    const er: Record<string, string> = {};
    if (!passwordOk(password)) er.password = "Your password doesn't meet the requirements below.";
    if (confirm !== password) er.confirm = "The passwords don't match.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) { setErrors({ form: error.message }); return; }
    setPassword(""); setConfirm(""); setOk(true);
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-md space-y-4">
      {errors.form && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{errors.form}</p>}
      {ok && <p className="text-sm text-mute" aria-live="polite">Password changed.</p>}
      <PasswordField label="New password" value={password} onChange={setPassword} error={errors.password} showRules autoComplete="new-password" />
      <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
      <SubmitButton busy={busy}>Change password</SubmitButton>
    </form>
  );
}
