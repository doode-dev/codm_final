import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/ui";
import ResetForm from "@/components/auth/ResetForm";

export const metadata: Metadata = { title: "Choose a new password | CODM Accounts" };

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you don't use anywhere else.">
      <ResetForm />
    </AuthShell>
  );
}
