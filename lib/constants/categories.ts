export interface CategoryConfig {
  slug: string;
  name: string;
  description: string;
  heroTagline: string;
}

export const AAAS_CATEGORIES: CategoryConfig[] = [
  {
    slug: "handbags",
    name: "Handbags",
    description: "Artisan-stitched crochet handbags, heirloom potlis, and everyday totes crafted with luxury yarn.",
    heroTagline: "Carry pure artisan elegance with every stitch.",
  },
  {
    slug: "keychains",
    name: "Keychains",
    description: "Delicate handcrafted floral, animal, and amigurumi charm keychains.",
    heroTagline: "Miniature works of art for your daily essentials.",
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Exquisite handmade lifestyle accents, pouches, and wearable crochet accessories.",
    heroTagline: "Refined handmade accents designed to cherish.",
  },
];

export const CATEGORY_MAP: Record<string, CategoryConfig> = AAAS_CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.slug.toLowerCase()] = cat;
    return acc;
  },
  {} as Record<string, CategoryConfig>
);

/**
 * Get category configuration by slug (case-insensitive).
 */
export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  if (!slug) return undefined;
  return CATEGORY_MAP[slug.toLowerCase().trim()];
}

/**
 * Check if a given slug corresponds to a valid canonical AaaS category.
 */
export function isValidCategorySlug(slug: string): boolean {
  return Boolean(getCategoryBySlug(slug));
}

/**
 * Maps any category string or slug to the canonical category name ("Handbags", "Keychains", "Accessories").
 * Returns null if not matched.
 */
export function getCanonicalCategoryName(categoryOrSlug: string): string | null {
  if (!categoryOrSlug) return null;
  const clean = categoryOrSlug.trim().toLowerCase();
  for (const cat of AAAS_CATEGORIES) {
    if (cat.slug === clean || cat.name.toLowerCase() === clean) {
      return cat.name;
    }
  }
  return null;
}

/**
 * Maps a category name or slug to its URL slug ("handbags", "keychains", "accessories").
 * Defaults to "products" for unknown categories.
 */
export function getCategorySlug(categoryOrSlug: string): string {
  if (!categoryOrSlug) return "products";
  const clean = categoryOrSlug.trim().toLowerCase();
  for (const cat of AAAS_CATEGORIES) {
    if (cat.slug === clean || cat.name.toLowerCase() === clean) {
      return cat.slug;
    }
  }
  return "products";
}

/**
 * Returns the URL path for a given category.
 * If canonical, returns `/category/${slug}`.
 * Otherwise returns `/products`.
 */
export function getCategoryPath(categoryOrSlug: string): string {
  const slug = getCategorySlug(categoryOrSlug);
  return slug === "products" ? "/products" : `/category/${slug}`;
}

/**
 * Case-insensitive comparison between a product's stored category and a target category or slug.
 */
export function matchesCategory(
  productCategory: string | undefined | null,
  targetCategoryOrSlug: string
): boolean {
  if (!productCategory || !targetCategoryOrSlug) return false;
  const pCat = productCategory.trim().toLowerCase();
  const target = targetCategoryOrSlug.trim().toLowerCase();

  // Direct match
  if (pCat === target) return true;

  // Canonical cross-match
  const targetCanonical = getCanonicalCategoryName(target);
  const pCanonical = getCanonicalCategoryName(pCat);

  if (targetCanonical && pCanonical) {
    return targetCanonical === pCanonical;
  }

  return false;
}
