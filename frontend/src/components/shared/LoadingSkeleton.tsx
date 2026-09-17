export function PackageCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden animate-pulse dark:bg-gray-900 dark:border-gray-800">
      <div className="h-4 bg-gray-200 w-20 m-4 rounded dark:bg-gray-800" />
      <div className="px-4 pb-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4 dark:bg-gray-800" />
        <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-800" />
        <div className="h-4 bg-gray-200 rounded w-2/3 dark:bg-gray-800" />
        <div className="h-4 bg-gray-200 rounded w-1/3 dark:bg-gray-800" />
        <div className="h-10 bg-gray-200 rounded mt-4 dark:bg-gray-800" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container-custom mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 dark:bg-gray-800" />
      <div className="h-4 bg-gray-200 rounded w-2/3 dark:bg-gray-800" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[...Array(6)].map((_, i) => (
          <PackageCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}