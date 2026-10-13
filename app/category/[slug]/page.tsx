import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { getActiveProductsServer } from "@/lib/supabase/products-server";
import { getCategoryBySlug, matchesCategory } from "@/lib/constants/categories";
import ProductGrid from "@/components/ProductGrid";
import { ProductCardSkeleton } from "@/components/Skeletons";
import { getCanonicalUrl, siteConfig } from "@/lib/seo";
import { generateBreadcrumbSchema } from "@/lib/schema";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  const pageUrl = getCanonicalUrl(`/category/${category.slug}`);

  return {
    title: `${category.name} | Handcrafted Collection`,
    description: category.description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title: `${category.name} | ${siteConfig.brandName}`,
      description: category.description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | ${siteConfig.brandName}`,
      description: category.description,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", item: siteConfig.url },
    { name: category.name, item: `${siteConfig.url}/category/${category.slug}` },
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
            {category.name}
          </h1>
          <p className="text-[#5C745F] font-light leading-relaxed text-sm sm:text-base">
            {category.description}
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
          <CategoryProductsContent categoryName={category.name} />
        </Suspense>
      </div>
    </section>
  );
}

async function CategoryProductsContent({ categoryName }: { categoryName: string }) {
  const allActive = await getActiveProductsServer();
  const categoryProducts = allActive.filter((product) =>
    matchesCategory(product.category, categoryName)
  );

  return <ProductGrid products={categoryProducts} />;
}
