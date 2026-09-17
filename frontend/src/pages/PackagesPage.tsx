import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Calendar, ArrowRight, AlertCircle } from "lucide-react";
import SeoHead from "@/components/shared/Seo";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { usePackages } from "@/hooks/usePackages";
import { useUmrahSettings } from "@/hooks/useUmrahSettings";
import PackageGrid from "@/components/packages/PackageGrid";
import PackageFilters from "@/components/packages/PackageFilters";
import { Badge } from "@/components/ui/badge";

export default function PackagesPage() {
  const { duration } = useParams();
  const [searchParams] = useSearchParams();
  const { data: umrahSettings } = useUmrahSettings();
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    airlineId: searchParams.get("airlineId") || "",
    hotelId: "",
    roomTypeId: "",
    minPrice: "",
    maxPrice: "",
  });

  const apiFilters: Record<string, string> = {};
  if (duration) apiFilters.durationDays = duration;
  if (filters.search) apiFilters.search = filters.search;
  if (filters.airlineId) apiFilters.airlineId = filters.airlineId;
  if (filters.roomTypeId) apiFilters.roomTypeId = filters.roomTypeId;
  if (filters.minPrice) apiFilters.minPrice = filters.minPrice;
  if (filters.maxPrice) apiFilters.maxPrice = filters.maxPrice;
  apiFilters.status = "ACTIVE";
  apiFilters.limit = "100";

  const { data, isLoading } = usePackages(apiFilters);

  const pageTitle = duration === "14"
    ? "14 Days Umrah Packages from Pakistan"
    : duration === "21"
    ? "21 Days Umrah Packages from Pakistan"
    : "Umrah Packages from Pakistan";
  const pageDescription = duration === "14"
    ? "Compare 14 days Umrah packages from Pakistan with multiple airlines and hotels in Makkah & Madinah. Check visa, flight, hotel and total price."
    : duration === "21"
    ? "Compare 21 days Umrah packages from Pakistan with multiple airlines and hotels in Makkah & Madinah. Check visa, flight, hotel and total price."
    : "Browse Umrah packages from Pakistan - 14 and 21 day options with multiple airlines and hotels in Makkah & Madinah.";

  return (
    <>
      <SeoHead
        title={pageTitle}
        description={pageDescription}
        path={duration ? `/packages/${duration}` : "/packages"}
        jsonLd={
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mssons.com/" },
              { "@type": "ListItem", position: 2, name: "Umrah Packages", item: "https://www.mssons.com/packages" },
              ...(duration ? [{ "@type": "ListItem", position: 3, name: `${duration} Days`, item: `https://www.mssons.com/packages/${duration}` }] : []),
            ],
          }
        }
      />

      <section className="bg-brand-green py-14 md:py-20">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Breadcrumbs
            tone="light"
            items={[
              { label: "Umrah Packages", to: duration ? "/packages" : undefined },
              ...(duration ? [{ label: `${duration} Days` }] : []),
            ]}
          />
          <Badge variant="secondary" className="bg-brand-gold text-white mt-2 mb-5">
            {duration ? `${duration} Days` : "All Packages"}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">{pageTitle}</h1>
          <p className="text-white/70 mt-3">Choose from our carefully curated travel packages</p>
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto">
          {umrahSettings && (
            <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4 md:justify-start rounded-2xl bg-white border border-brand-green/20 p-5 shadow-sm dark:bg-gray-900 dark:border-white/10">
              <div className="space-y-1.5">
                <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                  <Calendar className="w-4 h-4 text-brand-green" />
                  Umrah rates valid till {new Date(umrahSettings.validity + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })} check-in
                </p>
                {umrahSettings.condition && (
                  <p className="text-sm text-gray-500 flex items-start gap-1.5 dark:text-gray-400">
                    <AlertCircle className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
                    {umrahSettings.condition}
                  </p>
                )}
              </div>
              <Link
                to="/custom-package"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green text-white font-semibold hover:bg-brand-green/90 transition-colors shrink-0"
              >
                Build Your Own Package <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
          <PackageFilters filters={filters} onFilterChange={setFilters} durationDays={duration ? parseInt(duration) : undefined} />
          <PackageGrid packages={data?.data || []} loading={isLoading} showDurationBadge={!duration} />
          {data?.pagination && data.pagination.total > 0 && (
            <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
              Showing {data.data.length} of {data.pagination.total} packages
            </div>
          )}
        </div>
      </section>
    </>
  );
}
