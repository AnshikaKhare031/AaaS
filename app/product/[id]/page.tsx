import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductServer, getProductsServer } from "@/lib/supabase/products-server";
import { getCanonicalCategoryName, getCategorySlug, matchesCategory } from "@/lib/constants/categories";
import ProductCard from "@/components/ProductCard";
import CollapsibleSection from "@/components/CollapsibleSection";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";
import ProductImage from "@/components/ProductImage";
import { Shield, Sparkles, RefreshCw, ChevronLeft } from "lucide-react";
import { ProductDetailsSkeleton } from "@/components/Skeletons";

import type { Metadata } from "next";
import { siteConfig, getCanonicalUrl } from "@/lib/seo";
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/schema";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductServer(id);

  if (!product || product.is_active === false) {
    return {
      title: "Product Not Found",
    };
  }

  const productName = product.name || product.title || "Handcrafted Creation";
  const cleanDescription = product.description
    ? product.description.substring(0, 160)
    : `Buy ${productName} from ${siteConfig.brandName}. Premium handmade crochet and artisan lifestyle collection, thoughtfully crafted in India.`;

  const pageUrl = getCanonicalUrl(`/product/${product.id}`);

  return {
    title: productName,
    description: cleanDescription,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${productName} | ${siteConfig.name}`,
      description: cleanDescription,
      url: pageUrl,
      type: "article",
      images: [
        {
          url: product.image_url,
          alt: productName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${productName} | ${siteConfig.name}`,
      description: cleanDescription,
      images: [product.image_url],
    },
  };
}

export default function ProductDetailsPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<ProductDetailsSkeleton />}>
      <ProductDetailsContent params={params} />
    </Suspense>
  );
}

async function ProductDetailsContent({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductServer(id);

  if (!product || product.is_active === false) {
    notFound();
  }

  const productName = product.name || product.title || "Handcrafted Creation";
  const canonicalCategory = getCanonicalCategoryName(product.category) || product.category || "Handmade";
  const categorySlug = getCategorySlug(product.category);
  const categoryPath = categorySlug === "products" ? "/products" : `/category/${categorySlug}`;

  // Get related products from same category, excluding current product
  const allProducts = await getProductsServer();
  const relatedProducts = allProducts
    .filter(
      (p) =>
        p.is_active !== false &&
        p.id !== product.id &&
        matchesCategory(p.category, product.category)
    )
    .slice(0, 3);

  const productSchema = generateProductSchema(product);

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", item: siteConfig.url },
    { name: canonicalCategory, item: `${siteConfig.url}${categoryPath}` },
    { name: productName, item: `${siteConfig.url}/product/${product.id}` },
  ]);

  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-[#F8F2E7]">
      {/* Product JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {/* Breadcrumb JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Back Link */}
        <Link
          href={categoryPath}
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#5C745F] hover:text-[#25382E] font-medium mb-6 md:mb-10 transition-colors duration-200 group font-sans"
        >
          <ChevronLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to {canonicalCategory}</span>
        </Link>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start pb-12 md:pb-20 border-b border-[#E5DACB]">
          {/* Left: Product Images Frame */}
          <div className="lg:col-span-6 relative lg:sticky lg:top-28 self-start w-full">
            <ProductImage src={product.image_url} alt={productName} />
          </div>

          {/* Right: Product Meta Data */}
          <div className="lg:col-span-6 flex flex-col space-y-6 md:space-y-8 font-sans">
            {/* Header info */}
            <div className="space-y-3 order-1 lg:order-1">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#5C745F] font-medium">
                <span className="text-[#EC8D99]">{canonicalCategory}</span>
                <span>•</span>
                <span className="text-[#5C745F]">100% Handcrafted</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#25382E] leading-[1.12] font-light">
                {productName}
              </h1>

              <div className="flex items-center gap-4 pt-1">
                <span className="font-serif text-2xl lg:text-3xl font-semibold text-[#25382E]">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-[#25382E] bg-[#F6C4C2]/50 px-3 py-1 rounded-full">
                  Made to Order
                </span>
              </div>
            </div>

            {/* Story & Details */}
            <div className="order-3">
              <CollapsibleSection title="Artisan Story & Details">
                <p className="text-[#5C745F] text-sm sm:text-base font-light leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </CollapsibleSection>
            </div>

            {/* Interactive Purchase CTA Section */}
            <div className="order-2 lg:order-6 space-y-6 pt-2 lg:pt-0">
              <ProductPurchaseSection product={product} />

              {/* Trust factors */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#E5DACB] text-[10px] uppercase tracking-[0.18em] text-[#5C745F] text-center font-medium">
                <div className="flex flex-col items-center gap-1.5">
                  <Shield size={15} className="text-[#5C745F]" />
                  <span>Secure Order</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <Sparkles size={15} className="text-[#F5C842]" />
                  <span>Artisan Craft</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <RefreshCw size={15} className="text-[#5C745F]" />
                  <span>Made to Order</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suggested / Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="pt-14 md:pt-20 space-y-8 md:space-y-10">
            <div className="text-center max-w-xl mx-auto space-y-2 font-sans">
              <div className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EC8D99]" />
                <span className="text-[10px] uppercase tracking-[0.24em] font-medium text-[#5C745F]">
                  Artisan Recommendations
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-[#25382E] font-light">
                You May Also Cherish
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-8">
              {relatedProducts.map((relatedProd) => (
                <ProductCard key={relatedProd.id} product={relatedProd} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
