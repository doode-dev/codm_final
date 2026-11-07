"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isEmail } from "@/lib/validate";
import { CheckField, PasswordField, SubmitButton, TextField, linkCls } from "./ui";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!isEmail(email)) er.email = "Enter a valid email address.";
    if (!password) er.password = "Enter your password.";
    setErrors(er);
    if (Object.keys(er).length) return;

    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) throw new Error("The email or password is wrong.");

      const { data: profile } = await supabase.from("profiles").select("status,role").eq("id", data.user.id).single();
      if (profile?.status === "banned") {
        await supabase.auth.signOut();
        throw new Error("This account has been banned.");
      }
      const next = new URLSearchParams(window.location.search).get("next");
      const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safe ?? (profile?.role === "admin" ? "/admin" : "/"));
      router.refresh();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not log in. Try again." });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {errors.form && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{errors.form}</p>}
      <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
      <PasswordField label="Password" value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
      <div className="flex items-center justify-between gap-4">
        <CheckField checked={remember} onChange={setRemember}>Keep me logged in</CheckField>
        <a href="/auth/forgot-password" className={`${linkCls} shrink-0 text-sm`}>Forgot password?</a>
      </div>
      <SubmitButton busy={busy}>Log in</SubmitButton>
    </form>
  );
}
