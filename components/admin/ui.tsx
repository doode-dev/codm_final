"use client";

import { useEffect, useRef, useState } from "react";

export const th = "whitespace-nowrap border-b border-line bg-surface px-3 py-2 font-medium text-mute";
export const td = "px-3 py-3 align-top";
export const btn = "rounded-sm border border-line px-2.5 py-1 text-xs hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line";
export const btnPrimary = "rounded-sm bg-olive px-2.5 py-1 text-xs font-medium text-white hover:bg-olive-dark";
export const btnDanger = "rounded-sm border border-alert px-2.5 py-1 text-xs text-alert hover:bg-alert hover:text-white";
export const input = "rounded-sm border border-line bg-black px-3 py-2 text-sm placeholder:text-mute/70";

const good = ["active", "completed", "verified", "paid", "actioned", "success"];
const warn = ["pending_review", "pending", "under_review", "open", "on_hold", "awaiting_payment", "created", "refund_pending", "initialized"];
const bad = ["banned", "suspended", "rejected", "removed", "disputed", "payment_failed", "needs_review", "failed"];

export function Badge({ s, text }: { s: string; text?: string }) {
  const tone = good.includes(s) ? "bg-olive text-white border-olive" : warn.includes(s) ? "border-olive text-olive"
    : bad.includes(s) ? "border-alert text-alert" : "border-line text-mute";
  const label = (text ?? s).replace(/_/g, " ");
  return <span className={`inline-block whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium ${tone}`}>{label.charAt(0).toUpperCase() + label.slice(1)}</span>;
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 max-w-xl text-sm text-mute">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: {
  tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} aria-pressed={value === t.id}
          className={`rounded-sm border px-3 py-1.5 text-sm ${value === t.id ? "border-olive text-olive" : "border-line text-mute hover:text-ink"}`}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 text-xs">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={`${input} w-full sm:w-72`} />;
}

export function Table({ children, min = "56rem" }: { children: React.ReactNode; min?: string }) {
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full text-left text-sm" style={{ minWidth: min }}>{children}</table>
    </div>
  );
}

export const Empty = ({ children }: { children: React.ReactNode }) => <p className="border border-line bg-surface p-6 text-sm text-mute">{children}</p>;

export function ReasonDialog({ open, title, body, confirmLabel, danger, optional, onConfirm, onClose }: {
  open: boolean; title: string; body: string; confirmLabel: string; danger?: boolean; optional?: boolean;
  onConfirm: (reason: string) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { setReason(""); d.showModal(); }
    if (!open && d.open) d.close();
  }, [open]);
  const ok = optional || reason.trim().length >= 5;
  return (
    <dialog ref={ref} onClose={onClose} className="m-auto w-[min(28rem,calc(100%-1.5rem))] rounded-sm bg-surface p-0 text-ink">
      <form onSubmit={(e) => { e.preventDefault(); if (ok) onConfirm(reason.trim()); }} className="space-y-4 p-5">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm leading-relaxed text-mute">{body}</p>
        <label className="block text-sm">
          <span className="mb-1 block text-mute">Reason{optional ? " (optional)" : ""}</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={`${input} w-full`} />
          {!optional && <span className="mt-1 block text-xs text-mute">This is saved in the audit log. Use at least 5 characters.</span>}
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btn}>Cancel</button>
          <button type="submit" disabled={!ok} className={`${danger ? btnDanger : btnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}>{confirmLabel}</button>
        </div>
      </form>
    </dialog>
  );
}
