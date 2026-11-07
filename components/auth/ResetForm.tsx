"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { passwordOk } from "@/lib/validate";
import { PasswordField, SubmitButton, linkCls } from "./ui";

export default function ResetForm() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setSignedIn(!!data.user)).catch(() => setSignedIn(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!passwordOk(password)) er.password = "Your password doesn't meet the requirements below.";
    if (confirm !== password) er.confirm = "The passwords don't match.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) { setErrors({ form: error.message }); setBusy(false); return; }
    setDone(true);
  }

  if (signedIn === false) {
    return <p className="text-sm leading-relaxed text-mute">This page only works from the link in your reset email. <a href="/auth/forgot-password" className={linkCls}>Send a new link</a></p>;
  }
  if (done) {
    return (
      <div className="space-y-3">
        <p className="font-medium">Password changed</p>
        <a href="/" className={`${linkCls} text-sm`}>Continue to the site</a>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {errors.form && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{errors.form}</p>}
      <PasswordField label="New password" value={password} onChange={setPassword} error={errors.password} showRules autoComplete="new-password" />
      <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
      <SubmitButton busy={busy || signedIn === null}>Change password</SubmitButton>
    </form>
  );
}
