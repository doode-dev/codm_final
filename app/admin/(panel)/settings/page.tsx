"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { PageHeader, btnPrimary, input } from "@/components/admin/ui";
import type { Settings } from "@/data/admin";

export default function SettingsAdmin() {
  const { settings, saveSettings } = useAdmin();
  const [s, setS] = useState<Settings>(settings);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => { setS((p) => ({ ...p, [k]: v })); setSaved(false); };
  const bad = (n: number, max: number) => !Number.isFinite(n) || n < 0 || n > max;
  const errors = { sellerCommissionPct: bad(s.sellerCommissionPct, 50), buyerFeePct: bad(s.buyerFeePct, 50), reviewWindowDays: bad(s.reviewWindowDays, 30) };
  const invalid = Object.values(errors).some(Boolean);

  const num = (label: string, k: "sellerCommissionPct" | "buyerFeePct" | "reviewWindowDays", hint: string, max: number) => (
    <label className="block text-sm">
      <span className="mb-1 block text-mute">{label}</span>
      <input type="number" min={0} max={max} step="0.5" value={s[k]} onChange={(e) => set(k, Number(e.target.value))} className={`${input} w-40 ${errors[k] ? "border-alert" : ""}`} />
      <span className={`mt-1 block text-xs ${errors[k] ? "text-alert" : "text-mute"}`}>{errors[k] ? `Enter a number from 0 to ${max}.` : hint}</span>
    </label>
  );
  const toggle = (label: string, hint: string, k: "autoApproveVerifiedSellers" | "maintenanceMode") => (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" checked={s[k]} onChange={(e) => set(k, e.target.checked)} className="mt-1 size-4 accent-[var(--color-olive)]" />
      <span><span className="block font-medium">{label}</span><span className="text-xs text-mute">{hint}</span></span>
    </label>
  );

  return (
    <>
      <PageHeader title="Fees and settings" sub="Changes are written to the audit log. New fees apply to orders created after you save." />
      <form onSubmit={(e) => { e.preventDefault(); if (!invalid) { saveSettings(s); setSaved(true); } }} className="max-w-xl space-y-8">
        <section className="space-y-5 border border-line bg-surface p-5">
          <h2 className="font-bold">Fees</h2>
          {num("Seller commission (%)", "sellerCommissionPct", "Taken from the sale price when an order completes.", 50)}
          {num("Buyer service fee (%)", "buyerFeePct", "Added at checkout and shown to the buyer first.", 50)}
          {num("Buyer review window (days)", "reviewWindowDays", "How long a buyer has to confirm or open a dispute.", 30)}
        </section>
        <section className="space-y-5 border border-line bg-surface p-5">
          <h2 className="font-bold">Marketplace</h2>
          {toggle("Auto-approve listings from verified sellers", "Skips the review queue. Leave off while you are still building trust.", "autoApproveVerifiedSellers")}
          {toggle("Maintenance mode", "Pauses new orders and shows a notice to buyers.", "maintenanceMode")}
        </section>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={invalid} className={`${btnPrimary} px-5 py-2.5 text-sm disabled:opacity-40`}>Save changes</button>
          {saved && <p className="text-sm text-mute" aria-live="polite">Saved.</p>}
        </div>
      </form>
    </>
  );
}
