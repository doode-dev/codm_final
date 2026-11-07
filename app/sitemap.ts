import type { MetadataRoute } from "next";
import { legal } from "@/data/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const pages = ["", "/accounts", "/info", "/contact", ...Object.keys(legal).map((s) => `/legal/${s}`)];
  return pages.map((p) => ({ url: `${site}${p}`, lastModified: new Date() }));
}
