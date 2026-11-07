import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-5 py-20">
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm text-mute">That page doesn&apos;t exist, or you don&apos;t have access to it.</p>
        <Link href="/" className="mt-6 inline-block rounded-sm bg-olive px-4 py-2 text-sm font-medium text-white hover:bg-olive-dark">Back to the home page</Link>
      </main>
      <Footer />
    </>
  );
}
