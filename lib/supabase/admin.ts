import { createClient } from "@supabase/supabase-js";

// Server only. Uses the service role key, which bypasses row level security. Never import this in a client component,
// and never put the key in a NEXT_PUBLIC_ variable.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Payments aren't configured: SUPABASE_SERVICE_ROLE_KEY is missing.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
