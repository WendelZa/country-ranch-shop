import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

interface SitemapEntry { path: string; changefreq?: string; priority?: string; }

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/loja", changefreq: "daily", priority: "0.9" },
          { path: "/auth", changefreq: "monthly", priority: "0.3" },
          { path: "/politicas/privacidade", changefreq: "yearly", priority: "0.3" },
          { path: "/politicas/trocas", changefreq: "yearly", priority: "0.3" },
          { path: "/politicas/entrega", changefreq: "yearly", priority: "0.3" },
          { path: "/politicas/contato", changefreq: "yearly", priority: "0.3" },
        ];
        const urls = entries.map((e) => `  <url><loc>${BASE_URL}${e.path}</loc>${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ""}${e.priority ? `<priority>${e.priority}</priority>` : ""}</url>`);
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
