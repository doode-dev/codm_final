import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Call this at the top of every admin layout, page, server action and route handler.
// Admins must be signed in, have the admin role, AND have passed the two-factor check (aal2).
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase.from("profiles").select("username,role,status").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || profile.status !== "active") notFound();

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/auth/mfa?next=/admin");
  return { user, profile, supabase };
}
