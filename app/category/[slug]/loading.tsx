import React from "react";
import { ProductCardSkeleton } from "@/components/Skeletons";

export default function CategoryLoading() {
  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-28 min-h-screen bg-[#F8F2E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Header Skeleton */}
        <div className="max-w-2xl border-b border-[#E5DACB] pb-6 md:pb-10 mb-10 md:mb-14 space-y-3 font-sans">
          <div className="h-4 w-28 bg-[#E5DACB]/60 rounded-full animate-pulse" />
          <div className="h-10 sm:h-14 w-64 bg-[#E5DACB]/80 rounded-xl animate-pulse" />
          <div className="h-4 w-full max-w-md bg-[#E5DACB]/50 rounded-md animate-pulse" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {Array.from({ length: 6 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
