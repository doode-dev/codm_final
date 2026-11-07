import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InfoSections from "@/components/InfoSections";

export const metadata: Metadata = {
  title: "How it works | CODM Accounts",
  description: "How buying and selling works, how we keep it safe, fees, and answers to common questions.",
};

export default function InfoPage() {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">How CODM Accounts works</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">
            How to buy, how to sell, how we try to keep both safe, and what we cannot promise.
          </p>
        </section>
        <InfoSections />
      </main>
      <Footer />
    </>
  );
}
