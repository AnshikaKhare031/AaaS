export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.aaasatelier.in",
  name: "AaaS Atelier",
  brandName: "AaaS Atelier",
  defaultTitle: "AaaS Atelier | Luxury Handcrafted Crochet & Artisan Creations",
  defaultDescription: "Artisan-stitched crochet handbags, delicate floral charm keychains, heirloom pouches, and wearable crochet accessories. Lovingly handmade in India.",
  defaultOgImage: "https://seyqdbdvcofdvgjxsvbt.supabase.co/storage/v1/object/public/product-images/1792234991928_product5.png",
  twitterCard: "summary_large_image" as const,
  locale: "en_IN",
  keywords: [
    "handmade crochet",
    "crochet handbags",
    "artisan crochet",
    "amigurumi keychains",
    "crochet accessories",
    "luxury handcrafted gifts",
    "handmade in India",
    "AaaS Atelier",
    "slow fashion crochet",
    "artisan boutique"
  ],
  author: {
    name: "AaaS Atelier Team",
    url: "https://www.aaasatelier.in"
  }
};

/**
 * Helper to generate a standardized canonical URL for any route path.
 * Ensures consistent domain prefixes and eliminates trailing slash issues.
 */
export function getCanonicalUrl(path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // Remove trailing slash if present (except for root homepage)
  const formattedPath = cleanPath === "/" ? "" : cleanPath.replace(/\/$/, "");
  return `${siteConfig.url}${formattedPath}`;
}
