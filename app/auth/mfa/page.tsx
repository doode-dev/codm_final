import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/ui";
import MfaPanel from "@/components/auth/MfaPanel";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Two-factor check | CODM Accounts", robots: { index: false } };

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return (
    <AuthShell title="Two-factor check" subtitle="Admin access needs a code from your authenticator app, as well as your password.">
      <MfaPanel next={next ?? "/admin"} />
    </AuthShell>
  );
}
