export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isUsername = (v: string) => /^[A-Za-z0-9_]{3,20}$/.test(v);
export const passwordChecks = (v: string) => [
  { label: "At least 8 characters", ok: v.length >= 8 },
  { label: "A letter", ok: /[A-Za-z]/.test(v) },
  { label: "A number", ok: /\d/.test(v) },
];
export const passwordOk = (v: string) => passwordChecks(v).every((c) => c.ok);
