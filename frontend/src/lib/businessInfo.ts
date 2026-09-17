import { SITE_NAME, SITE_URL } from "./seo";
import type { Review } from "@/types";

// Single source of truth for business contact details (NAP) + the
// TravelAgency structured data derived from them. Footer, ContactPage and
// HomePage all pull from here so the name/address/phone stays identical
// site-wide and in the JSON-LD that uses it.

export interface BusinessInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  whatsappNumber: string;
}

// Placeholder social URLs - replace with official pages when available.
export const SOCIAL_URLS = {
  facebook: "https://www.facebook.com/mssons",
  instagram: "https://www.instagram.com/mssons",
  youtube: "https://www.youtube.com/@MS-Sons-Tours",
};

// Office coordinates (Islamabad, Pakistan). Replace with exact office
// coordinates when confirmed. Not part of settings yet, so kept as defaults.
export const BUSINESS_GEO = { latitude: 33.6844, longitude: 73.0479 };

// Opening hours used for LocalBusiness/TravelAgency JSON-LD.
export const BUSINESS_OPENING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const BUSINESS_OPENING_TIME = "10:00";
export const BUSINESS_CLOSING_TIME = "19:00";

export function getBusinessInfo(settings?: Record<string, string> | null): BusinessInfo {
  return {
    name: settings?.business_name || SITE_NAME,
    phone: settings?.phone_number || "+923145802373",
    email: settings?.email || "mssonstravel@gmail.com",
    address: settings?.address || "Wah Model Town Phase II",
    whatsappNumber: settings?.whatsapp_number || "923713011519",
  };
}

export function travelAgencyJsonLd(
  settings?: Record<string, string> | null,
  options?: { reviews?: Review[]; sameAs?: string[] },
): Record<string, unknown> {
  const info = getBusinessInfo(settings);
  const sameAs = options?.sameAs?.length ? options.sameAs : Object.values(SOCIAL_URLS);
  const locality = info.address.split(",")[0]?.trim() || "Islamabad";
  const reviews = options?.reviews;

  let aggregateRating: Record<string, unknown> | undefined;
  let review: Record<string, unknown>[] | undefined;

  if (reviews?.length) {
    const average =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: average.toFixed(1),
      reviewCount: reviews.length,
      bestRating: "5",
    };
    review = reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      reviewRating: { "@type": "Rating", ratingValue: String(r.rating), bestRating: "5" },
      reviewBody: r.text,
      ...(r.date ? { datePublished: r.date } : {}),
    }));
  }

  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: info.name,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/favicon.svg`,
    image: `${SITE_URL}/og-image.png`,
    telephone: info.phone,
    email: info.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: info.address,
      addressLocality: locality,
      addressCountry: "PK",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS_GEO.latitude,
      longitude: BUSINESS_GEO.longitude,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: BUSINESS_OPENING_DAYS,
      opens: BUSINESS_OPENING_TIME,
      closes: BUSINESS_CLOSING_TIME,
    },
    sameAs,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: info.phone,
      availableLanguage: ["English", "Urdu"],
    },
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(review ? { review } : {}),
  };
}