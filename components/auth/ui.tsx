"use client";

import { useId, useState } from "react";
import { passwordChecks } from "@/lib/validate";

export const inputCls = "w-full rounded-sm border border-line bg-black px-3 py-2.5 text-sm placeholder:text-mute/70";

export function AuthShell({ title, subtitle, children, footer, wide }: {
  title: string; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className={`mx-auto w-full px-5 py-12 ${wide ? "max-w-xl" : "max-w-md"}`}>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 text-sm leading-relaxed text-mute">{subtitle}</p>}
      <div className="mt-6 rounded-sm border border-line bg-surface p-6">{children}</div>
      {footer && <p className="mt-5 text-sm text-mute">{footer}</p>}
    </div>
  );
}

function Message({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) return <p id={`${id}-e`} className="mt-1 text-xs text-alert">{error}</p>;
  return hint ? <p className="mt-1 text-xs text-mute">{hint}</p> : null;
}

export function TextField({ label, error, hint, className = "", ...input }: {
  label: string; error?: string; hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-mute">{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined}
        className={`${inputCls} ${error ? "border-alert" : ""} ${className}`} {...input} />
      <Message id={id} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({ label, error, children, ...sel }: {
  label: string; error?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-mute">{label}</label>
      <select id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined}
        className={`${inputCls} ${error ? "border-alert" : ""}`} {...sel}>{children}</select>
      <Message id={id} error={error} />
    </div>
  );
}

export function PasswordField({ label, value, onChange, error, showRules, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; showRules?: boolean; autoComplete?: string;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-mute">{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} value={value} autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined}
          className={`${inputCls} pr-16 ${error ? "border-alert" : ""}`} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}
          className="absolute inset-y-0 right-0 px-3 text-xs text-mute hover:text-ink">{show ? "Hide" : "Show"}</button>
      </div>
      <Message id={id} error={error} />
      {showRules && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {passwordChecks(value).map((c) => (
            <li key={c.label} className={c.ok ? "text-ink" : "text-mute"}>{c.ok ? "Done: " : ""}{c.label}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CheckField({ checked, onChange, error, children }: {
  checked: boolean; onChange: (v: boolean) => void; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
          className="mt-1 size-4 shrink-0 accent-[var(--color-olive)]" />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1 pl-7 text-xs text-alert">{error}</p>}
    </div>
  );
}

export function SubmitButton({ children, busy }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <button type="submit" disabled={busy}
      className="w-full rounded-sm bg-olive px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-dark disabled:opacity-60">
      {busy ? "Please wait" : children}
    </button>
  );
}

export const linkCls = "text-ink underline underline-offset-4 hover:text-olive";
