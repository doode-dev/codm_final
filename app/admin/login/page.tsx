import type { Metadata } from "next";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { AuthShell } from "@/components/auth/ui";

export const metadata: Metadata = { title: "Admin sign-in", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <AuthShell title="Admin sign-in" subtitle="For the site owner only. You will be asked for a two-factor code next.">
      <AdminLoginForm />
    </AuthShell>
  );
}
