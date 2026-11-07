"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordField, SubmitButton, TextField } from "@/components/auth/ui";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const generic = "Wrong email or password, or this account can't use the admin panel.";
    try {
      const supabase = createClient();
      const { data, error: e1 } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (e1 || !data.user) throw new Error(generic);
      const { data: p } = await supabase.from("profiles").select("role,status").eq("id", data.user.id).single();
      if (p?.role !== "admin" || p?.status !== "active") { await supabase.auth.signOut(); throw new Error(generic); }
      router.push("/auth/mfa?next=/admin"); // the two-factor page sends you on if you have already passed it
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : generic);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{error}</p>}
      <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
      <SubmitButton busy={busy}>Continue</SubmitButton>
    </form>
  );
}
