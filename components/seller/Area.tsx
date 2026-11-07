"use client";

import { useId } from "react";
import { inputCls } from "@/components/auth/ui";

export default function Area({ label, hint, error, className = "", ...rest }: {
  label: string; hint?: string; error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-mute">{label}</label>
      <textarea id={id} aria-invalid={!!error} className={`${inputCls} ${error ? "border-alert" : ""} ${className}`} {...rest} />
      {error ? <p className="mt-1 text-xs text-alert">{error}</p> : hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}
