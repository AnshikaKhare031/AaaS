import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductServer, getProductsServer } from "@/lib/supabase/products-server";
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

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const cleanDescription = product.description
    ? product.description.substring(0, 160)
    : `Buy ${product.title} from AaaS. Premium handmade crochet and artisan craft, high-quality and thoughtfully crafted in India.`;

  const pageUrl = getCanonicalUrl(`/product/${product.id}`);

  return {
    title: product.title,
    description: cleanDescription,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${product.title} | ${siteConfig.name}`,
      description: cleanDescription,
      url: pageUrl,
      type: "article",
      images: [
        {
          url: product.image_url,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | ${siteConfig.name}`,
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

  if (!product) {
    notFound();
  }

  // Get related products from same category, excluding current product
  const allProducts = await getProductsServer();
  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const getCareInstructions = (category: string) => {
    switch (category) {
      case "crochet":
        return "Gentle hand wash with mild detergent in cold water. Do not wring or twist. Lay flat on a clean dry towel in the shade to preserve shape and tension. Avoid sharp accessories that may snag artisan yarn stitches.";
      case "mdf":
        return "Wipe gently with a dry microfiber cloth. Avoid water submergence or abrasive cleaners. Display away from direct harsh sunlight to preserve the hand-painted luster.";
      case "pouch":
        return "Hand-wash in cold water with mild detergent. Do not wring or tumble dry. Dry flat in shade. Iron on reverse side on low heat if needed.";
      case "magnet":
        return "Clean gently with a soft dry cloth. Handle with care to prevent chipping. Keep in a dry ambient space.";
      case "rakhis":
        return "Keep dry and store safely in the keepsake pouch. Avoid contact with moisture, perfumes, and lotions.";
      default:
        return "Handle with care as an original handcrafted creation. Clean with a soft dry cloth.";
    }
  };

  const careInstructions = getCareInstructions(product.category);
  const productSchema = generateProductSchema(product);

  const categoryPath = product.category === "pouch" ? "/pouches" : product.category === "magnet" ? "/magnets" : `/${product.category}`;
  const categoryName = product.category === "crochet" ? "Crochet Creations" : product.category === "mdf" ? "MDF Arts" : product.category === "pouch" ? "Hand-painted Pouches" : product.category === "rakhis" ? "Handmade Rakhis" : "Fridge Magnets";

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", item: siteConfig.url },
    { name: categoryName, item: `${siteConfig.url}${categoryPath}` },
    { name: product.title, item: `${siteConfig.url}/product/${product.id}` },
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
          <span>Back to {categoryName}</span>
        </Link>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start pb-12 md:pb-20 border-b border-[#E5DACB]">
          
          {/* Left: Product Images Frame */}
          <div className="lg:col-span-6 relative lg:sticky lg:top-28 self-start w-full">
            <ProductImage src={product.image_url} alt={product.title} />
          </div>

          {/* Right: Product Meta Data */}
          <div className="lg:col-span-6 flex flex-col space-y-6 md:space-y-8 font-sans">
            
            {/* Header info */}
            <div className="space-y-3 order-1 lg:order-1">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#5C745F] font-medium">
                <span className="text-[#EC8D99]">
                  {product.category === "crochet" ? "Crochet" : product.category === "mdf" ? "MDF Wood Art" : product.category === "pouch" ? "Handmade Pouch" : product.category === "rakhis" ? "Handmade Rakhi" : "Clay Magnet"}
                </span>
                <span>•</span>
                <span className="text-[#5C745F]">100% Handcrafted</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#25382E] leading-[1.12] font-light">
                {product.title}
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

            {/* Customization Note Box */}
            {product.customizable && (
              <div className="bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-5 flex items-start gap-3.5 order-3 lg:order-2 shadow-2xs">
                <Sparkles className="text-[#F5C842] shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] font-medium text-[#25382E]">Customizable Piece</p>
                  <p className="text-[#5C745F] text-xs sm:text-sm font-light leading-relaxed">
                    This creation is handcrafted to order. You can request tailored color palettes, custom sizes, or personalized details by emailing us at craftymindstudios@gmail.com or via WhatsApp.
                  </p>
                </div>
              </div>
            )}

            {/* Story & Details */}
            <div className="order-4 lg:order-3">
              <CollapsibleSection title="Artisan Story & Details">
                <p className="text-[#5C745F] text-sm sm:text-base font-light leading-relaxed">
                  {product.description}
                </p>
              </CollapsibleSection>
            </div>

            {/* Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="order-5 lg:order-4 pt-1 lg:pt-0">
                <CollapsibleSection title="Specifications">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-[#5C745F] font-light">
                    {product.specifications.map((spec, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EC8D99] shrink-0" />
                        <span><strong className="font-medium text-[#25382E]">{spec.label}:</strong> {spec.value}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              </div>
            )}

            {/* Care Instructions */}
            <div className="order-6 lg:order-5 pt-1 lg:pt-0">
              <CollapsibleSection title="Care Instructions">
                <p className="text-[#5C745F] text-sm sm:text-base font-light leading-relaxed">
                  {careInstructions}
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
