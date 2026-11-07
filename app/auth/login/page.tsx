import type { Metadata } from "next";
import { AuthShell, linkCls } from "@/components/auth/ui";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in | CODM Accounts" };

export default function LoginPage() {
  return (
    <AuthShell title="Log in" subtitle="Welcome back."
      footer={<>New here? <a href="/auth/register" className={linkCls}>Create an account</a></>}>
      <LoginForm />
    </AuthShell>
  );
}
