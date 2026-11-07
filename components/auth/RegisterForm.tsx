"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { countries } from "@/data/site";
import { isEmail, isUsername, passwordOk } from "@/lib/validate";
import { normalizePhone } from "@/lib/phone";
import Area from "@/components/seller/Area";
import { CheckField, PasswordField, SelectField, SubmitButton, TextField, linkCls } from "./ui";

type Role = "buyer" | "seller" | "both";
const intents: { id: Role; title: string; body: string }[] = [
  { id: "buyer", title: "I'm here to buy", body: "Browse accounts, save the ones you like, and check out. We hold your payment until you confirm the account." },
  { id: "seller", title: "I'm here to sell", body: "List your accounts and get paid when they sell. You will set up your seller profile as part of signing up." },
  { id: "both", title: "I'm here to buy and sell", body: "Do both from one account. You will set up your seller profile too." },
];

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("buyer");
  const [v, setV] = useState({
    username: "", email: "", country: "", password: "", confirm: "", terms: false, risk: false,
    sellerName: "", phone: "", bio: "", ownership: false, sellerPolicy: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((p) => ({ ...p, [k]: val }));

  const sells = role !== "buyer";
  const total = sells ? 3 : 2;
  const last = step === total - 1;

  async function validate(s: number) {
    const e: Record<string, string> = {};
    const supabase = createClient();
    if (s === 1) {
      if (!isUsername(v.username)) e.username = "Use 3 to 20 letters, numbers or underscores.";
      if (!isEmail(v.email)) e.email = "Enter a valid email address.";
      if (!v.country) e.country = "Choose your country.";
      if (!passwordOk(v.password)) e.password = "Your password doesn't meet the requirements below.";
      if (v.confirm !== v.password) e.confirm = "The passwords don't match.";
      if (!v.terms) e.terms = "Accept the terms and privacy policy to continue.";
      if (!v.risk) e.risk = "Acknowledge the risk to continue.";
      if (!e.username) {
        const { data } = await supabase.rpc("username_available", { p_username: v.username });
        if (data === false) e.username = "That username is taken. Try another.";
      }
    }
    if (s === 2) {
      if (!/^[A-Za-z0-9_]{3,24}$/.test(v.sellerName)) e.sellerName = "Use 3 to 24 letters, numbers or underscores.";
      if (!normalizePhone(v.phone)) e.phone = "Enter a number with the country code, like +233 24 000 0000.";
      if (!v.ownership) e.ownership = "Confirm that you own the accounts you list.";
      if (!v.sellerPolicy) e.sellerPolicy = "Accept the seller policy to continue.";
      if (!e.sellerName) {
        const { data } = await supabase.rpc("seller_name_available", { p_name: v.sellerName });
        if (data === false) e.sellerName = "That seller name is taken. Try another.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    try {
      if (step > 0 && !(await validate(step))) { setBusy(false); return; }
      if (!last) { setStep(step + 1); setBusy(false); return; }

      const { data, error } = await createClient().auth.signUp({
        email: v.email.trim(),
        password: v.password,
        // A database trigger reads these. It only accepts buyer, seller or both, and creates the seller profile when it is filled in.
        options: {
          data: { username: v.username, country: v.country, role, ...(sells ? { seller_name: v.sellerName, phone: normalizePhone(v.phone) ?? "", bio: v.bio.trim() } : {}) },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      if (data.user && data.user.identities?.length === 0) throw new Error("An account with this email already exists. Log in instead.");
      if (data.session) { router.push(sells ? "/sell" : "/"); router.refresh(); return; } // email confirmation is switched off
      router.push(`/auth/verify-email?email=${encodeURIComponent(v.email)}&role=${role}`);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not create your account. Try again." });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <p className="text-sm text-mute">Step {step + 1} of {total}</p>

      {step === 0 && (
        <fieldset>
          <legend className="mb-3 font-medium">What brings you here?</legend>
          <div className="space-y-3">
            {intents.map((r) => (
              <label key={r.id} className="block cursor-pointer rounded-sm border border-line bg-black p-4 has-[:checked]:border-olive has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-olive">
                <input type="radio" name="role" value={r.id} checked={role === r.id} onChange={() => setRole(r.id)} className="sr-only" />
                <span className="flex items-center justify-between gap-3">
                  <span className="font-medium">{r.title}</span>
                  <span aria-hidden className={`size-4 rounded-full border ${role === r.id ? "border-olive bg-olive" : "border-line"}`} />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-mute">{r.body}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <TextField label="Username" value={v.username} onChange={(e) => set("username", e.target.value)} error={errors.username}
            hint="Shown publicly on reviews and messages." autoComplete="username" />
          <TextField label="Email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} error={errors.email} autoComplete="email" />
          <SelectField label="Country" value={v.country} onChange={(e) => set("country", e.target.value)} error={errors.country}>
            <option value="">Choose a country</option>
            {countries.map((c) => <option key={c}>{c}</option>)}
          </SelectField>
          <PasswordField label="Password" value={v.password} onChange={(x) => set("password", x)} error={errors.password} showRules autoComplete="new-password" />
          <PasswordField label="Confirm password" value={v.confirm} onChange={(x) => set("confirm", x)} error={errors.confirm} autoComplete="new-password" />
          <div className="space-y-3 border-t border-line pt-4">
            <CheckField checked={v.risk} onChange={(x) => set("risk", x)} error={errors.risk}>
              I understand that buying or selling a game account breaks Activision&apos;s terms, can lead to a ban or loss of access, and that this site cannot prevent that.{" "}
              <a href="/legal/risk-disclosure" className={linkCls}>Risk disclosure</a>
            </CheckField>
            <CheckField checked={v.terms} onChange={(x) => set("terms", x)} error={errors.terms}>
              I accept the <a href="/legal/terms" className={linkCls}>terms of service</a> and the <a href="/legal/privacy" className={linkCls}>privacy policy</a>.
            </CheckField>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="font-medium">Your seller profile</p>
          <TextField label="Seller name" value={v.sellerName} onChange={(e) => set("sellerName", e.target.value)} error={errors.sellerName}
            hint="Shown on your listings. You can't change it later." autoComplete="off" />
          <TextField label="Phone number" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone}
            hint="With the country code. After you sign in, we text you a code to verify it. Only our team sees this, never buyers." autoComplete="tel" />
          <Area label="About you (optional)" rows={3} maxLength={280} value={v.bio} onChange={(e) => set("bio", e.target.value)} hint="Up to 280 characters." />
          <div className="space-y-3">
            <CheckField checked={v.ownership} onChange={(x) => set("ownership", x)} error={errors.ownership}>
              I own every account I list, and I will never put passwords or one-time codes in a listing.
            </CheckField>
            <CheckField checked={v.sellerPolicy} onChange={(x) => set("sellerPolicy", x)} error={errors.sellerPolicy}>
              I have read the <a href="/legal/seller-policy" className={linkCls}>seller policy</a> and the 10% commission on completed sales.
            </CheckField>
          </div>
        </div>
      )}

      {errors.form && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{errors.form}</p>}

      <div className="flex gap-3">
        {step > 0 && (
          <button type="button" onClick={() => { setErrors({}); setStep(step - 1); }} className="rounded-sm border border-line px-4 py-2.5 text-sm hover:border-ink">Back</button>
        )}
        <SubmitButton busy={busy}>{last ? "Create account" : "Continue"}</SubmitButton>
      </div>
    </form>
  );
}
