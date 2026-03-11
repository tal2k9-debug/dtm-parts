import { Suspense } from "react";
import CatalogContent from "./CatalogContent";

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogLoading() {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="shimmer h-10 w-48 rounded-xl mb-2" />
        <div className="shimmer h-6 w-32 rounded-lg mb-8" />
        <div className="shimmer h-32 rounded-2xl mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-4">
              <div className="shimmer h-48 rounded-xl mb-4" />
              <div className="shimmer h-5 w-3/4 rounded mb-3" />
              <div className="shimmer h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
