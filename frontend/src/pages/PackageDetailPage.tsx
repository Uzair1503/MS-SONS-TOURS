import { useParams } from "react-router-dom";
import SeoHead from "@/components/shared/Seo";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { usePackage } from "@/hooks/usePackages";
import PackageDetailView from "@/components/packages/PackageDetailView";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";

export default function PackageDetailPage() {
  const { id } = useParams();
  const { data, isLoading, error } = usePackage(id || "");

  if (isLoading) return <PageSkeleton />;
  if (error || !data?.data) return <ErrorState message="Package not found" />;

  const pkg = data.data;
  const description = `${pkg.title} - ${pkg.durationDays} days Umrah package from Pakistan with ${pkg.airline?.name || "multiple airlines"}. Check visa, flight, hotel and price.`;
  const availablePrices = (pkg.roomPrices || []).filter((rp) => rp.available && rp.price > 0);
  const minPrice = availablePrices.length > 0 ? Math.min(...availablePrices.map((rp) => rp.price)) : null;

  return (
    <>
      <SeoHead
        title={pkg.title}
        description={description}
        path={`/package/${id}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mssons.com/" },
              { "@type": "ListItem", position: 2, name: "Umrah Packages", item: "https://www.mssons.com/packages" },
              { "@type": "ListItem", position: 3, name: pkg.title, item: `https://www.mssons.com/package/${id}` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: pkg.title,
            description,
            url: `https://www.mssons.com/package/${id}`,
            brand: { "@type": "Brand", name: "MS Sons Tours" },
            ...(minPrice !== null
              ? {
                  offers: {
                    "@type": "AggregateOffer",
                    priceCurrency: "PKR",
                    lowPrice: minPrice,
                    highPrice: minPrice,
                    offerCount: availablePrices.length,
                  },
                }
              : {}),
          },
        ]}
      />
      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto">
          <Breadcrumbs
            items={[
              { label: "Umrah Packages", to: "/packages" },
              { label: pkg.title },
            ]}
          />
          <PackageDetailView pkg={pkg} />
        </div>
      </section>
    </>
  );
}
