import React, { Suspense } from "react";
import { getProductsServer } from "@/lib/supabase/products-server";
import ProductGrid from "@/components/ProductGrid";
import { ProductCardSkeleton } from "@/components/Skeletons";

import { getCanonicalUrl, siteConfig } from "@/lib/seo";
import { generateBreadcrumbSchema } from "@/lib/schema";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Handmade Rakhis",
  description: "Celebrate sacred bonds with handcrafted designer rakhis made from premium threads, delicate crochet beads, and artisan silk by AaaS.",
  alternates: {
    canonical: getCanonicalUrl("/rakhis"),
  },
  openGraph: {
    type: "website",
    url: getCanonicalUrl("/rakhis"),
    title: "Handmade Rakhis | AaaS",
    description: "Celebrate sacred bonds with handcrafted designer rakhis made from premium threads, delicate crochet beads, and artisan silk by AaaS.",
  },
};

export default function RakhisCategoryPage() {
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", item: siteConfig.url },
    { name: "Handmade Rakhis", item: `${siteConfig.url}/rakhis` },
  ]);

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-28 min-h-screen bg-[#F8F2E7]">
      {/* Breadcrumb JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        
        {/* Category Header */}
        <div className="max-w-2xl border-b border-[#E5DACB] pb-6 md:pb-10 mb-10 md:mb-14 space-y-3 font-sans">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EC8D99]" />
            <span className="text-[10px] uppercase tracking-[0.24em] font-medium text-[#5C745F]">
              Atelier Collection
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl tracking-tight text-[#25382E] font-light">
            Handmade Rakhis
          </h1>
          <p className="text-[#5C745F] font-light leading-relaxed text-sm sm:text-base">
            Celebrate the sacred sibling bond with artisan rakhis delicately woven from pure silk threads, hand-crocheted accents, and heirloom beads.
          </p>
        </div>

        {/* Product Grid inside Suspense */}
        <Suspense fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        }>
          <RakhisProductsContent />
        </Suspense>

      </div>
    </section>
  );
}

async function RakhisProductsContent() {
  const allProducts = await getProductsServer();
  const rakhisProducts = allProducts.filter((p) => p.category === "rakhis");
  return <ProductGrid products={rakhisProducts} />;
}
