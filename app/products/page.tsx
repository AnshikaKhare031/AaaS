import React, { Suspense } from "react";
import { getActiveProductsServer } from "@/lib/supabase/products-server";
import ProductGrid from "@/components/ProductGrid";
import { ProductCardSkeleton } from "@/components/Skeletons";
import { getCanonicalUrl, siteConfig } from "@/lib/seo";
import { generateBreadcrumbSchema } from "@/lib/schema";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Products | Handcrafted Creations",
  description: "Browse the complete collection of handcrafted crochet handbags, delicate charm keychains, and artisan lifestyle accessories by AaaS.",
  alternates: {
    canonical: getCanonicalUrl("/products"),
  },
  openGraph: {
    type: "website",
    url: getCanonicalUrl("/products"),
    title: "All Products | AaaS Atelier",
    description: "Browse the complete collection of handcrafted crochet handbags, delicate charm keychains, and artisan lifestyle accessories by AaaS.",
  },
};

export default function ProductsPage() {
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", item: siteConfig.url },
    { name: "All Products", item: `${siteConfig.url}/products` },
  ]);

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-28 min-h-screen bg-[#F8F2E7]">
      {/* Breadcrumb JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Header */}
        <div className="max-w-2xl border-b border-[#E5DACB] pb-6 md:pb-10 mb-10 md:mb-14 space-y-3 font-sans">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EC8D99]" />
            <span className="text-[10px] uppercase tracking-[0.24em] font-medium text-[#5C745F]">
              Atelier Archive
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl tracking-tight text-[#25382E] font-light">
            All Handcrafted Creations
          </h1>
          <p className="text-[#5C745F] font-light leading-relaxed text-sm sm:text-base">
            Every creation is patiently made by hand, one stitch and knot at a time. Browse our complete catalog of heirloom crochet bags, charm keychains, and artisan lifestyle accents.
          </p>
        </div>

        {/* Product Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {Array.from({ length: 6 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))}
            </div>
          }
        >
          <ProductsContent />
        </Suspense>
      </div>
    </section>
  );
}

async function ProductsContent() {
  const products = await getActiveProductsServer();
  return <ProductGrid products={products} />;
}
