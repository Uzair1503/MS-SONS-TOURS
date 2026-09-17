// Post-build static prerender for the public marketing routes.
// Generates a per-route dist/<route>/index.html so nginx
// `try_files $uri $uri/ /index.html` serves statically rendered head
// metadata before the SPA hydrates.
//
// Intentional limits:
//   - Only public marketing routes (no /admin, no dynamic package/hotel pages).
//   - Only title/description/canonical/Open Graph/Twitter tags are injected.
//   - NO JSON-LD is written statically - the runtime <SeoHead /> (react-helmet)
//     manages structured data so TravelAgency/Article blocks never duplicate.
//
// Route metadata mirrors each page's existing SeoHead props (see frontend seo.ts
// for title suffixing). Update this table when page titles or descriptions change.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SITE_URL = "https://www.mssons.com";
const DIST = resolve("dist");

const ROUTES = [
  {
    path: "/",
    title: "Hajj & Umrah Packages from Pakistan | MS Sons Tours",
    description:
      "Professional Hajj & Umrah travel packages from Pakistan. 14 and 21 day packages with Saudia, PIA, and AirSial airlines and multiple hotels in Makkah and Madinah.",
  },
  {
    path: "/packages",
    title: "Umrah Packages from Pakistan | MS Sons Tours",
    description:
      "Browse Umrah packages from Pakistan - 14 and 21 day options with multiple airlines and hotels in Makkah & Madinah.",
  },
  {
    path: "/packages/14",
    title: "14 Days Umrah Packages from Pakistan | MS Sons Tours",
    description:
      "Compare 14 days Umrah packages from Pakistan with multiple airlines and hotels in Makkah & Madinah. Check visa, flight, hotel and total price.",
  },
  {
    path: "/packages/21",
    title: "21 Days Umrah Packages from Pakistan | MS Sons Tours",
    description:
      "Compare 21 days Umrah packages from Pakistan with multiple airlines and hotels in Makkah & Madinah. Check visa, flight, hotel and total price.",
  },
  {
    path: "/hotels",
    title: "Hotels in Makkah & Madinah for Umrah | MS Sons Tours",
    description:
      "Browse Umrah hotels in Makkah and Madinah - see distance from Masjid al-Haram and Masjid an-Nabawi, room types and prices for your Umrah journey.",
  },
  {
    path: "/airlines",
    title: "Umrah Airlines from Pakistan | MS Sons Tours",
    description:
      "Choose from Saudia, PIA, and AirSial for your Umrah flight from Pakistan to Saudi Arabia. Compare airlines on MS Sons Tours.",
  },
  {
    path: "/about",
    title: "About Us | Umrah Travel Agency | MS Sons Tours",
    description:
      "MS Sons Tours is a professional Hajj & Umrah travel agency in Pakistan offering grouped Umrah packages with direct-airline flights, hotels near Haram, visa processing and ground transport.",
  },
  {
    path: "/faq",
    title: "Umrah Package FAQ | MS Sons Tours",
    description:
      "Frequently asked questions about MS Sons Tours Umrah packages - what's included, how to book, visa assistance, airlines, payment terms and cancellation.",
  },
  {
    path: "/contact",
    title: "Contact Us | MS Sons Tours",
    description:
      "Contact MS Sons Tours for Hajj & Umrah packages from Pakistan. Reach us on WhatsApp or email for booking, pricing and visa assistance.",
  },
  {
    path: "/blog",
    title: "Umrah Travel Blog | MS Sons Tours",
    description:
      "Umrah travel guides, packing checklists, hotel tips and visa guidance for pilgrims from Pakistan - written by MS Sons Tours.",
  },
  {
    path: "/blog/umrah-packing-checklist",
    title: "The Complete Umrah Packing Checklist | MS Sons Tours",
    description:
      "A practical packing list for Umrah - ihram essentials, documents, medication, and personal items you should not forget for Makkah and Madinah.",
  },
  {
    path: "/blog/best-time-to-perform-umrah",
    title: "Best Time to Perform Umrah | MS Sons Tours",
    description:
      "Umrah can be done all year round, but the ideal time depends on weather, crowds, and budget. Compare seasons to plan your journey wisely.",
  },
  {
    path: "/blog/how-to-choose-umrah-hotel",
    title: "How to Choose a Hotel Close to the Haram | MS Sons Tours",
    description:
      "Hotels near Masjid al-Haram in Makkah and Masjid an-Nabawi in Madinah vary in price, distance and facilities. A simple method to pick the right one.",
  },
  {
    path: "/blog/umrah-visa-and-document-guide",
    title: "Umrah Visa & Document Checklist for Pakistani Travelers | MS Sons Tours",
    description:
      "Everything you need to prepare your Umrah visa and travel documents - passports, photos, vaccination requirements, and how your agency handles the process.",
  },
];

function routeUrl(path) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

function strip(head, re) {
  return head.replace(re, "");
}

function buildStaticHead(title, description, url) {
  return [
    `    <meta name="description" content="${description}" />`,
    `    <link rel="canonical" href="${url}" />`,
    `    <meta property="og:title" content="${title}" />`,
    `    <meta property="og:description" content="${description}" />`,
    `    <meta property="og:url" content="${url}" />`,
    `    <meta name="twitter:title" content="${title}" />`,
    `    <meta name="twitter:description" content="${description}" />`,
    `    <title>${title}</title>`,
  ].join("\n");
}

function renderRoute(indexHtml, route) {
  const url = routeUrl(route.path);

  let head = indexHtml;
  head = strip(head, /<meta name="description"[^>]*\s\/?>/);
  head = strip(head, /<link rel="canonical"[^>]*\s\/?>/);
  head = strip(head, /<meta property="og:title"[^>]*\s\/?>/);
  head = strip(head, /<meta property="og:description"[^>]*\s\/?>/);
  head = strip(head, /<meta property="og:url"[^>]*\s\/?>/);
  head = strip(head, /<meta name="twitter:title"[^>]*\s\/?>/);
  head = strip(head, /<meta name="twitter:description"[^>]*\s\/?>/);
  head = strip(head, /<title>[\s\S]*?<\/title>/);

  const staticHead = buildStaticHead(route.title, route.description, url);
  return head.replace(/<\/head>/, `${staticHead}\n  </head>`);
}

function targetPath(routePath) {
  const rel = routePath === "/" ? "index.html" : `${routePath}/index.html`;
  const file = join(DIST, rel);
  mkdirSync(file.slice(0, file.lastIndexOf("\\")), { recursive: true });
  return file;
}

const baseHtml = readFileSync(join(DIST, "index.html"), "utf8");

for (const route of ROUTES) {
  const output = renderRoute(baseHtml, route);
  writeFileSync(targetPath(route.path), output, "utf8");
  console.log(`prerendered ${route.path} -> ${targetPath(route.path)}`);
}

console.log(`prerender: ${ROUTES.length} routes written`);