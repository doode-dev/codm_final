"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/phone";
import { setSellerPhone } from "@/app/sell/actions";

function friendly(message: string) {
  if (/sms|provider|twilio|messagebird|vonage|textlocal|phone/i.test(message) && /provider|sms|unable|configured/i.test(message)) {
    return "We couldn't send the text message. SMS sending isn't set up on the server yet.";
  }
  if (/already|exists|registered/i.test(message)) return "That number is already used by another account.";
  if (/rate|too many|seconds/i.test(message)) return "Please wait a minute before asking for another code.";
  return message;
}

export default function PhoneVerify({ phone }: { phone: string }) {
  const router = useRouter();
  const [value, setValue] = useState(phone);
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function send() {
    const p = normalizePhone(value);
    if (!p) { setError("Enter the number with the country code, like +233 24 000 0000."); return; }
    setBusy(true); setError("");
    const saved = await setSellerPhone(p);
    if (saved?.error) { setError(saved.error); setBusy(false); return; }
    const { error: e } = await createClient().auth.updateUser({ phone: p }); // Supabase texts a 6 digit code
    setBusy(false);
    if (e) { setError(friendly(e.message)); return; }
    setValue(p); setSent(true); setWait(60);
  }

  async function verify() {
    const p = normalizePhone(value);
    if (!p || !/^\d{6}$/.test(code.trim())) { setError("Enter the 6 digit code from the text message."); return; }
    setBusy(true); setError("");
    const { error: e } = await createClient().auth.verifyOtp({ phone: p, token: code.trim(), type: "phone_change" });
    setBusy(false);
    if (e) { setError("That code is wrong or has expired. Check it, or send a new one."); return; }
    router.refresh(); // the Seller centre unlocks
  }

  const input = "w-full rounded-sm border border-line bg-black px-3 py-2.5 text-sm";
  return (
    <section id="verify" className="mt-6 border border-olive bg-surface p-5">
      <h2 className="font-bold">Verify your phone number</h2>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-mute">
        You need a verified phone number before you can list accounts. We text you a 6 digit code. Your number stays private: only our team can see it.
      </p>
      <div className="mt-4 grid max-w-xl gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block text-sm">
          <span className="mb-1 block text-mute">Phone number</span>
          <input className={input} type="tel" autoComplete="tel" value={value} onChange={(e) => { setValue(e.target.value); setSent(false); }} />
        </label>
        <button type="button" disabled={busy || wait > 0} onClick={send}
          className="self-end rounded-sm border border-olive px-4 py-2.5 text-sm font-medium text-olive hover:bg-olive hover:text-white disabled:opacity-50">
          {wait > 0 ? `Send again in ${wait}s` : sent ? "Send a new code" : "Send code"}
        </button>
      </div>
      {sent && (
        <form className="mt-4 grid max-w-xl gap-3 sm:grid-cols-[1fr_auto]" onSubmit={(e) => { e.preventDefault(); verify(); }}>
          <label className="block text-sm">
            <span className="mb-1 block text-mute">6 digit code</span>
            <input className={`${input} tracking-[0.4em]`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          </label>
          <button disabled={busy} className="self-end rounded-sm bg-olive px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-dark disabled:opacity-60">Verify</button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-alert">{error}</p>}
    </section>
  );
}
