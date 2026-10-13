import { MetadataRoute } from "next";
import { getProductsServer } from "@/lib/supabase/products-server";
import { siteConfig } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // 1. Core static marketing and category pages
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/category/handbags`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/keychains`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/accessories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // 2. Fetch active catalog products from Supabase to register dynamic product detail pages
  try {
    const products = await getProductsServer();
    
    const productUrls: MetadataRoute.Sitemap = products
      .filter((p) => p.is_active !== false)
      .map((product) => {
        const dateString = product.updated_at || product.created_at || null;
        return {
          url: `${baseUrl}/product/${product.slug || product.id}`,
          lastModified: dateString ? new Date(dateString) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        };
      });

    return [...staticUrls, ...productUrls];
  } catch (error) {
    console.error("Failed to generate dynamic products sitemap mapping:", error);
    return staticUrls;
  }
}
