import Header from "@/components/Header";
import Banner from "@/components/Banner";
import HomeAccounts from "@/components/HomeAccounts";
import Footer from "@/components/Footer";
import { getListings } from "@/lib/listings";

export const revalidate = 60; // refetch accounts at most once a minute

export default async function Home() {
  const listings = await getListings();
  return (
    <>
      <Header />
      <main>
        <Banner />
        <section className="mx-auto max-w-6xl px-5 pb-8 pt-10">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Call of Duty: Mobile accounts, listed by the numbers.
          </h1>
          <p className="mt-4 max-w-2xl border-l-2 border-alert pl-3 text-sm leading-relaxed text-mute">
            Buying or selling a game account breaks Activision&apos;s terms. Accounts can be banned or recovered by their original owner.{" "}
            <a href="/legal/risk-disclosure" className="underline underline-offset-4">Read the risks</a> before you buy.{" "}
            New here? <a href="/info" className="underline underline-offset-4">See how it works</a>.
          </p>
        </section>
        <HomeAccounts listings={listings} />
      </main>
      <Footer />
    </>
  );
}
