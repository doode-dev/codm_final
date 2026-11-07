import type { Metadata } from "next";
import { AuthShell, linkCls } from "@/components/auth/ui";
import ForgotForm from "@/components/auth/ForgotForm";

export const metadata: Metadata = { title: "Reset your password | CODM Accounts" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we will send you a reset link."
      footer={<a href="/auth/login" className={linkCls}>Back to log in</a>}>
      <ForgotForm />
    </AuthShell>
  );
}
