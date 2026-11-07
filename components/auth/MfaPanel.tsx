"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "./ui";

type State = { kind: "loading" } | { kind: "verify"; factorId: string } | { kind: "enroll"; factorId: string; qr: string; secret: string } | { kind: "error"; message: string };

export default function MfaPanel({ next }: { next: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel === "aal2") { router.replace(safeNext); return; }
        const { data, error: e } = await supabase.auth.mfa.listFactors();
        if (e) throw e;
        const verified = data.totp[0];
        if (verified) { setState({ kind: "verify", factorId: verified.id }); return; }
        for (const f of data.all.filter((x) => x.status === "unverified")) await supabase.auth.mfa.unenroll({ factorId: f.id }); // clean up half-finished setups
        const { data: en, error: e2 } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator app" });
        if (e2) throw e2;
        setState({ kind: "enroll", factorId: en.id, qr: en.totp.qr_code, secret: en.totp.secret });
      } catch (err) {
        setState({ kind: "error", message: err instanceof Error ? err.message : "Could not start two-factor setup." });
      }
    })();
  }, [router, safeNext]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind !== "verify" && state.kind !== "enroll") return;
    if (!/^\d{6}$/.test(code)) { setError("Enter the 6 digit code from your authenticator app."); return; }
    setBusy(true); setError("");
    const supabase = createClient();
    const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId: state.factorId });
    const { error: e2 } = e1 || !ch ? { error: e1 } : await supabase.auth.mfa.verify({ factorId: state.factorId, challengeId: ch.id, code });
    setBusy(false);
    if (e2) { setError("That code is wrong or has expired. Try the newest code."); setCode(""); return; }
    router.replace(safeNext);
    router.refresh();
  }

  if (state.kind === "loading") return <p className="text-sm text-mute">Loading</p>;
  if (state.kind === "error") return <p role="alert" className="text-sm text-alert">{state.message}</p>;
  return (
    <form onSubmit={submit} className="space-y-4">
      {state.kind === "enroll" && (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-mute">
            Scan this code with an authenticator app (Google Authenticator, Authy, 1Password and similar), then type the 6 digit code it shows.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={state.qr} alt="Two-factor setup QR code" className="size-44 rounded-sm p-2" style={{ background: "#fff" }} />
          <p className="break-all text-xs text-mute">Can&apos;t scan? Enter this key by hand: <span className="text-ink">{state.secret}</span></p>
        </div>
      )}
      {state.kind === "verify" && <p className="text-sm text-mute">Enter the 6 digit code from your authenticator app.</p>}
      <label className="block text-sm">
        <span className="mb-1 block text-mute">6 digit code</span>
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus
          className="w-full rounded-sm border border-line bg-black px-3 py-2.5 text-sm tracking-[0.4em]" />
      </label>
      {error && <p role="alert" className="text-sm text-alert">{error}</p>}
      <SubmitButton busy={busy}>{state.kind === "enroll" ? "Turn on two-factor" : "Verify"}</SubmitButton>
    </form>
  );
}
