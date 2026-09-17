import { prisma } from "../config/prisma";
import { cache } from "../cache";
import { config } from "../config";

const SITEMAP_CACHE_KEY = "mssons:sitemap:xml";
const SITEMAP_TTL = 3600; // 1 hour

const STATIC_URLS = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/packages", priority: "0.9", changefreq: "daily" },
  { path: "/packages/14", priority: "0.9", changefreq: "daily" },
  { path: "/packages/21", priority: "0.9", changefreq: "daily" },
  { path: "/hotels", priority: "0.8", changefreq: "weekly" },
  { path: "/airlines", priority: "0.6", changefreq: "monthly" },
  { path: "/calculator", priority: "0.7", changefreq: "monthly" },
  { path: "/custom-package", priority: "0.8", changefreq: "monthly" },
  { path: "/booking", priority: "0.6", changefreq: "monthly" },
  { path: "/about", priority: "0.5", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/faq", priority: "0.5", changefreq: "monthly" },
  { path: "/blog", priority: "0.6", changefreq: "daily" },
  // Keep in sync with frontend/src/lib/blog.ts slugs.
  { path: "/blog/umrah-packing-checklist", priority: "0.6", changefreq: "monthly" },
  { path: "/blog/best-time-to-perform-umrah", priority: "0.6", changefreq: "monthly" },
  { path: "/blog/how-to-choose-umrah-hotel", priority: "0.6", changefreq: "monthly" },
  { path: "/blog/umrah-visa-and-document-guide", priority: "0.6", changefreq: "monthly" },
];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function iso(date: Date | null | undefined): string {
  return date ? date.toISOString() : new Date().toISOString();
}

function urlEntry(
  entryUrl: string,
  lastmod: string,
  priority: string,
  changefreq: string,
): string {
  return `  <url>\n    <loc>${xmlEscape(entryUrl)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function buildSitemapXml(): Promise<string> {
  const siteUrl = config.siteUrl.replace(/\/$/, "");
  const lastmod = new Date().toISOString();

  const [packages, hotels] = await Promise.all([
    prisma.package.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, updatedAt: true },
    }),
    prisma.hotel.findMany({
      where: { active: true },
      select: { id: true, updatedAt: true },
    }),
  ]);

  const entries = [
    ...STATIC_URLS.map((u) => urlEntry(`${siteUrl}${u.path}`, lastmod, u.priority, u.changefreq)),
    ...packages.map((p) =>
      urlEntry(`${siteUrl}/package/${p.id}`, iso(p.updatedAt), "0.8", "weekly"),
    ),
    ...hotels.map((h) =>
      urlEntry(`${siteUrl}/hotels/${h.id}`, iso(h.updatedAt), "0.7", "weekly"),
    ),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");
}

export async function getSitemapXml(): Promise<string> {
  try {
    const cached = await cache.get<string>(SITEMAP_CACHE_KEY);
    if (cached) return cached;
  } catch {
    // fall through to rebuild
  }

  const xml = await buildSitemapXml();
  await cache.set(SITEMAP_CACHE_KEY, xml, SITEMAP_TTL);
  return xml;
}

export async function invalidateSitemap(): Promise<void> {
  await cache.invalidate(SITEMAP_CACHE_KEY);
}