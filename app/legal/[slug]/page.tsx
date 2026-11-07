import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { legal } from "@/data/legal";

export function generateStaticParams() {
  return Object.keys(legal).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: legal[slug] ? `${legal[slug].title} | CODM Accounts` : "Not found" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = legal[slug];
  if (!page) notFound();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
        <p className="mt-2 border-l-2 border-alert pl-3 text-xs text-mute">Draft text. It should be reviewed by a lawyer before launch.</p>
        <div className="mt-8 space-y-6">
          {page.sections.map(([h, body]) => (
            <section key={h}><h2 className="font-bold">{h}</h2><p className="mt-1 max-w-prose text-sm leading-relaxed text-mute">{body}</p></section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
