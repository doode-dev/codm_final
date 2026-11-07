// Phone numbers are stored in international format: a plus sign, the country code, then the number (for example +233240000000).
export function normalizePhone(input: string): string | null {
  const s = input.replace(/[\s().-]/g, "");
  return /^\+[1-9][0-9]{7,14}$/.test(s) ? s : null;
}
