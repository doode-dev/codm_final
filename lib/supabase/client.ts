import { createBrowserClient } from "@supabase/ssr";

// For client components (login, register, sign out).
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Sign-in isn't set up yet. Add your Supabase keys to .env.local.");
  return createBrowserClient(url, key);
}
