import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/support/ContactForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Contact support | CODM Accounts" };

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-5 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Contact support</h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">Questions about an order, a payout, or something that looks wrong? Tell us and we will reply by email.</p>
        <div className="mt-6 border border-line bg-surface p-6"><ContactForm email={user?.email ?? ""} /></div>
      </main>
      <Footer />
    </>
  );
}
