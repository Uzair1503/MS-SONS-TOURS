// Centralized site URL + SEO configuration.
// Single source of truth for the production domain so no page hardcodes
// multiple competing URLs. Update SITE_URL here when deploying to a domain.

export const SITE_URL = "https://www.mssons.com";
export const SITE_NAME = "MS Sons Tours";
export const DEFAULT_TITLE = "Hajj & Umrah Packages from Pakistan | MS Sons Tours";
export const DEFAULT_DESCRIPTION =
  "MS Sons Tours - professional Hajj & Umrah travel packages from Pakistan. 14 and 21 day packages with multiple airlines and hotels in Makkah & Madinah.";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const OG_IMAGE_ALT =
  "MS Sons Tours - Hajj & Umrah packages from Pakistan with hotels in Makkah and Madinah";
export const FAVICON = "/favicon.svg";

export function canonicalUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/" || path === "") return `${SITE_URL}/`;
  return `${SITE_URL}${normalized}`;
}

export function cleanPath(path = "/"): string {
  const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? "/" : normalized.replace(/\/+$/, "");
}

export function pageTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}