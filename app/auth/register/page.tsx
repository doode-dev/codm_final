import type { Metadata } from "next";
import { AuthShell, linkCls } from "@/components/auth/ui";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create an account | CODM Accounts" };

export default function RegisterPage() {
  return (
    <AuthShell wide title="Create your account" subtitle="Choose how you will use the site. You can change this later."
      footer={<>Already have an account? <a href="/auth/login" className={linkCls}>Log in</a></>}>
      <RegisterForm />
    </AuthShell>
  );
}
