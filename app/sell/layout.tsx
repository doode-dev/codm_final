import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
    </>
  );
}
