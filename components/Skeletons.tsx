import React from "react";

// Individual Product Card Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-[#FFFAF1] border border-[#E5DACB] overflow-hidden shadow-none">
      {/* Image Placeholder */}
      <div className="relative aspect-[3/4] w-full skeleton-shimmer bg-[#F8F2E7]" />

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-grow justify-between space-y-4">
        <div className="space-y-2">
          {/* Category & Price Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="h-3 w-16 skeleton-shimmer bg-[#E5DACB]/50" />
            <div className="h-4 w-12 skeleton-shimmer bg-[#E5DACB]/50" />
          </div>
          {/* Title Placeholder */}
          <div className="h-5 w-3/4 skeleton-shimmer bg-[#E5DACB]/40 pt-1" />
        </div>

        {/* Button Placeholder */}
        <div className="h-9 w-full skeleton-shimmer bg-[#E5DACB]/30" />
      </div>
    </div>
  );
}

// Product Grid / Category Page Skeleton
export function ProductGridSkeleton({ categoryName = "Collection" }: { categoryName?: string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 page-fade-in py-24 md:py-32">
      {/* Category Header */}
      <div className="max-w-2xl border-b border-[#E5DACB] pb-6 md:pb-10 mb-8 md:mb-16 space-y-4">
        <div className="h-3 w-20 skeleton-shimmer bg-[#E5DACB]/50" />
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl tracking-tight text-[#25382E]">
          {categoryName === "Collection" ? (
            <div className="h-10 sm:h-14 md:h-16 w-60 skeleton-shimmer bg-[#E5DACB]/40" />
          ) : (
            categoryName
          )}
        </h1>
        <div className="space-y-2 pt-2">
          <div className="h-3.5 w-full skeleton-shimmer bg-[#E5DACB]/30" />
          <div className="h-3.5 w-5/6 skeleton-shimmer bg-[#E5DACB]/30" />
          <div className="h-3.5 w-2/3 skeleton-shimmer bg-[#E5DACB]/30" />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {Array.from({ length: 6 }).map((_, idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}

// Product Details Page Skeleton
export function ProductDetailsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-28 pb-16 md:pt-36 md:pb-24 page-fade-in">
      {/* Back Link Breadcrumb */}
      <div className="h-3.5 w-36 skeleton-shimmer bg-[#E5DACB]/50 mb-8 md:mb-12" />

      {/* Product Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start pb-12 md:pb-20 border-b border-[#E5DACB]/60">
        
        {/* Left Column: Image placeholder */}
        <div className="lg:col-span-6 w-full">
          <div className="aspect-[4/5] w-full skeleton-shimmer bg-[#F8F2E7] border border-[#E5DACB]/60 max-h-[460px] sm:max-h-none" />
        </div>

        {/* Right Column: Metadata */}
        <div className="lg:col-span-6 flex flex-col space-y-6 md:space-y-8 w-full">
          {/* Header Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-24 skeleton-shimmer bg-[#E5DACB]/50" />
              <div className="h-3 w-24 skeleton-shimmer bg-[#E5DACB]/50" />
            </div>
            {/* Title */}
            <div className="h-10 sm:h-12 w-5/6 skeleton-shimmer bg-[#E5DACB]/40" />
            {/* Price & Made to Order badge */}
            <div className="flex items-center gap-4 pt-2">
              <div className="h-7 w-24 skeleton-shimmer bg-[#E5DACB]/50" />
              <div className="h-6 w-28 skeleton-shimmer bg-[#E5DACB]/40" />
            </div>
          </div>

          {/* Customization box */}
          <div className="h-24 w-full skeleton-shimmer bg-[#FFFAF1] border border-[#E5DACB]/60" />

          {/* Skeletons of collapsibles */}
          <div className="space-y-4 pt-2">
            <div className="h-10 w-full skeleton-shimmer bg-[#FFFAF1] border-b border-[#E5DACB]/40" />
            <div className="h-10 w-full skeleton-shimmer bg-[#FFFAF1] border-b border-[#E5DACB]/40" />
            <div className="h-10 w-full skeleton-shimmer bg-[#FFFAF1] border-b border-[#E5DACB]/40" />
          </div>

          {/* CTAs */}
          <div className="space-y-4 pt-4 border-t border-[#E5DACB]/60">
            <div className="flex items-center gap-4">
              <div className="h-12 w-24 skeleton-shimmer bg-[#E5DACB]/40 shrink-0" />
              <div className="h-12 w-full skeleton-shimmer bg-[#25382E]/20" />
            </div>
            <div className="h-12 w-full skeleton-shimmer bg-[#25382E]/30" />
          </div>
        </div>

      </div>
    </div>
  );
}

// Homepage Loading Skeleton
export function HomepageSkeleton() {
  return (
    <div className="space-y-16 md:space-y-24 page-fade-in pt-16 bg-[#F8F2E7]">
      {/* Hero Section Placeholder */}
      <div className="w-full min-h-[70vh] md:min-h-[85vh] bg-[#F8F2E7] flex items-center justify-center border-b border-[#E5DACB]/50">
        <div className="max-w-3xl text-center space-y-6 px-4">
          <div className="h-4 w-28 skeleton-shimmer bg-[#E5DACB]/60 mx-auto" />
          <div className="h-12 sm:h-16 md:h-20 w-3/4 skeleton-shimmer bg-[#E5DACB]/50 mx-auto" />
          <div className="h-4 sm:h-5 w-1/2 skeleton-shimmer bg-[#E5DACB]/40 mx-auto" />
          <div className="h-12 w-48 skeleton-shimmer bg-[#25382E]/20 mx-auto pt-4" />
        </div>
      </div>

      {/* About Section Placeholder */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center py-12">
        <div className="aspect-[4/5] skeleton-shimmer bg-[#FFFAF1] border border-[#E5DACB]/60" />
        <div className="space-y-4">
          <div className="h-4 w-24 skeleton-shimmer bg-[#E5DACB]/50" />
          <div className="h-9 w-2/3 skeleton-shimmer bg-[#E5DACB]/40" />
          <div className="space-y-2 pt-2">
            <div className="h-3.5 w-full skeleton-shimmer bg-[#E5DACB]/30" />
            <div className="h-3.5 w-full skeleton-shimmer bg-[#E5DACB]/30" />
            <div className="h-3.5 w-4/5 skeleton-shimmer bg-[#E5DACB]/30" />
          </div>
        </div>
      </div>

      {/* Collections Section Placeholder */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12">
        <div className="max-w-xl mb-12 space-y-4">
          <div className="h-3.5 w-28 skeleton-shimmer bg-[#E5DACB]/50" />
          <div className="h-9 w-1/2 skeleton-shimmer bg-[#E5DACB]/40" />
          <div className="h-3.5 w-3/4 skeleton-shimmer bg-[#E5DACB]/30" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex flex-col bg-[#FFFAF1] border border-[#E5DACB]/60 overflow-hidden p-6 space-y-4">
              <div className="aspect-[4/5] skeleton-shimmer bg-[#F8F2E7]" />
              <div className="h-5 w-3/4 skeleton-shimmer bg-[#E5DACB]/40" />
              <div className="h-3.5 w-full skeleton-shimmer bg-[#E5DACB]/30" />
              <div className="h-3.5 w-20 skeleton-shimmer bg-[#E5DACB]/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Checkout Page Loading Skeleton
export function CheckoutSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-24 pb-12 md:pt-32 md:pb-24 page-fade-in bg-[#F8F2E7]">
      {/* Header */}
      <div className="border-b border-[#E5DACB]/60 pb-6 mb-8 md:mb-12">
        <div className="h-3.5 w-28 skeleton-shimmer bg-[#E5DACB]/50 mb-3" />
        <div className="h-10 sm:h-12 w-64 skeleton-shimmer bg-[#E5DACB]/40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        {/* Left Column - Shipping & Customer Info */}
        <div className="lg:col-span-7 space-y-8">
          {/* Customer info card */}
          <div className="bg-[#FFFAF1] border border-[#E5DACB] p-6 md:p-8 space-y-6">
            <div className="h-6 w-48 skeleton-shimmer bg-[#E5DACB]/50 border-b border-[#E5DACB]/60 pb-3" />
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-20 skeleton-shimmer bg-[#E5DACB]/40" />
                <div className="h-11 w-full skeleton-shimmer bg-[#FFFAF1] border border-[#E5DACB]/60" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-24 skeleton-shimmer bg-[#E5DACB]/40" />
                <div className="h-11 w-full skeleton-shimmer bg-[#FFFAF1] border border-[#E5DACB]/60" />
              </div>
            </div>
          </div>
          {/* Address card */}
          <div className="bg-[#FFFAF1] border border-[#E5DACB] p-6 md:p-8 space-y-6">
            <div className="h-6 w-48 skeleton-shimmer bg-[#E5DACB]/50 border-b border-[#E5DACB]/60 pb-3" />
            <div className="h-36 w-full skeleton-shimmer bg-[#FFFAF1] border border-[#E5DACB]/60" />
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FFFAF1] border border-[#E5DACB] p-6 md:p-8 space-y-6">
            <div className="h-6 w-40 skeleton-shimmer bg-[#E5DACB]/50 border-b border-[#E5DACB]/60 pb-3" />
            <div className="space-y-3">
              <div className="flex gap-4 items-center">
                <div className="aspect-[3/4] w-12 skeleton-shimmer bg-[#F8F2E7] border border-[#E5DACB]/40" />
                <div className="space-y-1.5 flex-grow">
                  <div className="h-4 w-32 skeleton-shimmer bg-[#E5DACB]/40" />
                  <div className="h-3 w-20 skeleton-shimmer bg-[#E5DACB]/30" />
                </div>
                <div className="h-4 w-10 skeleton-shimmer bg-[#E5DACB]/40" />
              </div>
            </div>
            <div className="border-t border-[#E5DACB]/60 pt-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-3.5 w-16 skeleton-shimmer bg-[#E5DACB]/40" />
                <div className="h-3.5 w-12 skeleton-shimmer bg-[#E5DACB]/40" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-24 skeleton-shimmer bg-[#E5DACB]/40" />
                <div className="h-4 w-16 skeleton-shimmer bg-[#E5DACB]/40" />
              </div>
            </div>
            <div className="h-12 w-full skeleton-shimmer bg-[#25382E]/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Fallback Generic Page Loader
export function GenericPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-28 pb-12 min-h-screen page-fade-in flex flex-col justify-center items-center bg-[#F8F2E7]">
      <div className="space-y-6 w-full max-w-xl text-center">
        <div className="h-10 w-2/3 skeleton-shimmer bg-[#E5DACB]/40 mx-auto" />
        <div className="h-3.5 w-full skeleton-shimmer bg-[#E5DACB]/30 mx-auto" />
        <div className="h-3.5 w-5/6 skeleton-shimmer bg-[#E5DACB]/30 mx-auto" />
        <div className="h-3.5 w-2/3 skeleton-shimmer bg-[#E5DACB]/30 mx-auto" />
      </div>
    </div>
  );
}
