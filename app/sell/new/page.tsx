import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingForm from "@/components/seller/ListingForm";
import { createListing } from "./actions";

export const metadata = { title: "List an account | CODM Accounts" };

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/sell/new");

  const { data: seller } = await supabase.from("sellers").select("id").eq("id", user.id).maybeSingle();
  if (!seller) redirect("/sell");
  const { data: phoneOk } = await supabase.rpc("seller_phone_verified");
  if (!phoneOk) redirect("/sell#verify");

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/sell" className="text-sm text-mute underline underline-offset-4 hover:text-ink">Back to Seller centre</Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">List an account</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">
        Give accurate details and clear screenshots. A moderator reviews every listing before it appears, usually within a day.
      </p>
      <p className="mt-4 border-l-2 border-alert pl-3 text-sm leading-relaxed text-mute">
        Never put passwords, recovery codes or one-time codes in a listing or a screenshot. Account transfers break Activision&apos;s terms and carry real risk.
      </p>
      <div className="mt-8">
        <ListingForm action={createListing} />
      </div>
    </div>
  );
}
