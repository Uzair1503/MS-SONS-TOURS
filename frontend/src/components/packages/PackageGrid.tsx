import type { Package } from "@/types";
import PackageCard from "./PackageCard";
import { PackageCardSkeleton } from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import { PackageIcon } from "lucide-react";

interface PackageGridProps {
  packages: Package[];
  loading?: boolean;
  showDurationBadge?: boolean;
}

function groupByAirline(packages: Package[]): Array<{ airline: string; items: Package[] }> {
  const groups = packages.reduce<Record<string, Package[]>>((acc, pkg) => {
    const key = pkg.airline?.name || "Other";
    (acc[key] = acc[key] || []).push(pkg);
    return acc;
  }, {});
  return Object.entries(groups).map(([airline, items]) => ({ airline, items }));
}

function groupId(airline: string): string {
  return `package-group-${airline.replace(/\s+/g, "-").toLowerCase()}`;
}

export default function PackageGrid({ packages, loading, showDurationBadge = true }: PackageGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <PackageCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <EmptyState
        title="No packages found"
        description="No packages match your current filters. Try adjusting your search criteria."
        icon={<PackageIcon className="w-12 h-12" />}
      />
    );
  }

  return (
    <div className="space-y-12">
      {groupByAirline(packages).map(({ airline, items }) => (
        <section key={airline} aria-labelledby={groupId(airline)} className="scroll-mt-24">
          <h2
            id={groupId(airline)}
            className="font-display font-bold text-2xl text-gray-900 dark:text-gray-100 pb-2 border-b border-brand-green/20 dark:border-white/10"
          >
            {airline} Packages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {items.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} showDurationBadge={showDurationBadge} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}