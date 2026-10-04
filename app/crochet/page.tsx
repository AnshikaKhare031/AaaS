import React, { Suspense } from "react";
import { getProductsServer } from "@/lib/supabase/products-server";
import ProductGrid from "@/components/ProductGrid";
import { ProductCardSkeleton } from "@/components/Skeletons";

import { getCanonicalUrl, siteConfig } from "@/lib/seo";
import { generateBreadcrumbSchema } from "@/lib/schema";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Crochet Creations",
  description: "Artisan crochet pieces thoughtfully crafted by hand. Explore amigurumi, accessories, lifestyle creations, and botanical crochet by AaaS.",
  alternates: {
    canonical: getCanonicalUrl("/crochet"),
  },
  openGraph: {
    type: "website",
    url: getCanonicalUrl("/crochet"),
    title: "Crochet Creations | AaaS",
    description: "Artisan crochet pieces thoughtfully crafted by hand. Explore amigurumi, accessories, lifestyle creations, and botanical crochet by AaaS.",
  },
};

export default function CrochetCategoryPage() {
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", item: siteConfig.url },
    { name: "Crochet Creations", item: `${siteConfig.url}/crochet` },
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
            Crochet Creations
          </h1>
          <p className="text-[#5C745F] font-light leading-relaxed text-sm sm:text-base">
            Thoughtfully crafted by hand, one stitch at a time. Discover botanical flowers, heirloom amigurumi, and lifestyle crochet made with quiet luxury.
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
          <CrochetProductsContent />
        </Suspense>

      </div>
    </section>
  );
}

async function CrochetProductsContent() {
  const allProducts = await getProductsServer();
  const crochetProducts = allProducts.filter((p) => p.category === "crochet");
  return <ProductGrid products={crochetProducts} />;
}
