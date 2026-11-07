import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import ShopProvider from "@/components/shop/ShopProvider";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: "CODM Accounts: buy and sell Call of Duty: Mobile accounts",
  description: "A marketplace for Call of Duty: Mobile accounts. Compare level, rank and inventory before you buy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body className="font-sans antialiased"><ShopProvider>{children}</ShopProvider></body>
    </html>
  );
}
