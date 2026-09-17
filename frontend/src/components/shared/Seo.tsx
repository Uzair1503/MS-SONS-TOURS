import { Helmet } from "react-helmet-async";
import {
  SITE_NAME,
  SITE_URL,
  OG_IMAGE,
  OG_IMAGE_ALT,
  canonicalUrl,
  pageTitle,
} from "@/lib/seo";

// Single head component used by every public page so that canonical URLs,
// Open Graph, Twitter metadata and structured data stay consistent.
// Avoids duplicating SEO systems across pages.

export type JsonLd = Record<string, unknown> | Record<string, unknown>[];

interface SeoHeadProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "product";
  jsonLd?: JsonLd;
  noindex?: boolean;
}

export default function SeoHead({
  title,
  description,
  path = "/",
  image = OG_IMAGE,
  imageAlt = OG_IMAGE_ALT,
  type = "website",
  jsonLd,
  noindex = false,
}: SeoHeadProps) {
  const url = canonicalUrl(path);
  const fullTitle = pageTitle(title);

  let jsonLdScript: string | undefined;
  if (jsonLd) {
    jsonLdScript = JSON.stringify(jsonLd);
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:url" content={url} />

      <meta property="og:logo" content={OG_IMAGE} />
      {jsonLdScript && (
        <script type="application/ld+json">{jsonLdScript}</script>
      )}
      <link rel="sitemap" type="application/xml" href={`${SITE_URL}/sitemap.xml`} />
    </Helmet>
  );
}