import type { Metadata } from "next";
import Header from "@/components/Header";
import AccountBrowser from "@/components/AccountBrowser";
import Footer from "@/components/Footer";
import { getListings } from "@/lib/listings";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Browse accounts | CODM Accounts",
  description: "Search and filter every active Call of Duty: Mobile account listing.",
};

export default async function AccountsPage() {
  const listings = await getListings();
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-6xl px-5 pb-6 pt-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Browse accounts</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">
            Search by skin, weapon or listing ID, then narrow by rank, price and inventory.
          </p>
          <p className="mt-4 max-w-2xl border-l-2 border-alert pl-3 text-sm leading-relaxed text-mute">
            Buying or selling a game account breaks Activision&apos;s terms. Accounts can be banned or recovered by their original owner.{" "}
            <a href="/legal/risk-disclosure" className="underline underline-offset-4">Read the risks</a> before you buy.
          </p>
        </section>
        <AccountBrowser listings={listings} />
      </main>
      <Footer />
    </>
  );
}
