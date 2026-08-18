import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register"],
      disallow: ["/dashboard", "/commitments", "/transactions", "/savings", "/insights", "/api/"],
    },
    sitemap: "https://platica-jjcn.vercel.app/sitemap.xml",
  };
}
