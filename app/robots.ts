import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/auth", "/cart", "/checkout", "/orders", "/profile", "/sell"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
