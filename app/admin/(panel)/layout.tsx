import type { Metadata } from "next";
import AdminProvider from "@/components/admin/store";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | CODM Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin(); // runs on the server before anything below is sent to the browser
  return (
    <AdminProvider>
      <AdminShell adminName={profile.username}>{children}</AdminShell>
    </AdminProvider>
  );
}
