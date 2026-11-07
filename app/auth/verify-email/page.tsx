import type { Metadata } from "next";
import { AuthShell, linkCls } from "@/components/auth/ui";

export const metadata: Metadata = { title: "Verify your email | CODM Accounts" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; role?: string }> }) {
  const { email, role } = await searchParams;
  const seller = role === "seller" || role === "both";
  return (
    <AuthShell title="Check your email"
      subtitle={email ? <>We sent a verification link to <span className="text-ink">{email}</span>.</> : "We sent you a verification link."}
      footer={<>Wrong address? <a href="/auth/register" className={linkCls}>Start again</a></>}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-mute">
          Open the link to activate your account. It expires in 24 hours. If you can&apos;t see it, check your spam folder.
        </p>
        {seller && (
          <p className="border-l-2 border-olive pl-3 text-sm leading-relaxed text-mute">
            Your seller profile is set up. After you verify your email, open the Seller centre to list your first account. Payouts are released once our team verifies you.
          </p>
        )}
        <p className="text-sm text-mute">Still nothing after a few minutes? Check the address above, then <a href="/auth/register" className={linkCls}>register again</a> or <a href="/contact" className={linkCls}>contact support</a>.</p>
      </div>
    </AuthShell>
  );
}
