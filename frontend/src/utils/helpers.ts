export const formatPrice = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export const getStockBadge = (stock: number, lowThreshold: number = 3) => {
  if (stock <= 0) {
    return {
      label: 'Out of Stock',
      color: 'bg-[#C96A6A]/15 text-[#C96A6A] border border-[#C96A6A]/30',
      isAvailable: false,
    };
  }
  if (stock <= lowThreshold) {
    return {
      label: `Low Stock (${stock} left)`,
      color: 'bg-[#D4A65A]/15 text-[#D4A65A] border border-[#D4A65A]/30',
      isAvailable: true,
    };
  }
  return {
    label: 'In Stock',
    color: 'bg-[#8FA57D]/15 text-[#8FA57D] border border-[#8FA57D]/30',
    isAvailable: true,
  };
};

export const getOrderStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
    case 'completed':
      return 'bg-[#8FA57D]/15 text-[#8FA57D] border border-[#8FA57D]/30';
    case 'shipped':
    case 'in_production':
      return 'bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30';
    case 'processing':
    case 'confirmed':
    case 'accepted':
    case 'reviewing':
      return 'bg-[#7B6656]/15 text-[#7B6656] border border-[#7B6656]/30';
    case 'cancelled':
    case 'rejected':
      return 'bg-[#C96A6A]/15 text-[#C96A6A] border border-[#C96A6A]/30';
    default:
      return 'bg-[#DDD6CF]/50 text-[#5A4335] border border-[#DDD6CF]';
  }
};

export const DEFAULT_PRODUCT_IMAGE = '/images/tulip_bouquet.jpg';

/**
 * Safely extracts the primary image URL from a product object across all possible schemas:
 * - product.images: [{ image_url: '...' }] or [{ url: '...' }]
 * - product.images: ['/images/...']
 * - product.image: '/images/...'
 * - product.product_image: '/images/...'
 * - product.image_url: '/images/...'
 * - string URL directly
 * Falls back to DEFAULT_PRODUCT_IMAGE if none found.
 */
export const getProductImageUrl = (product?: any): string => {
  if (!product) return DEFAULT_PRODUCT_IMAGE;

  if (typeof product === 'string' && product.trim().length > 0) {
    return product;
  }

  // 1. Direct single image properties
  if (typeof product.image === 'string' && product.image.trim().length > 0) {
    return product.image;
  }
  if (typeof product.image_url === 'string' && product.image_url.trim().length > 0) {
    return product.image_url;
  }
  if (typeof product.product_image === 'string' && product.product_image.trim().length > 0) {
    return product.product_image;
  }

  // 2. Images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === 'string' && first.trim().length > 0) {
      return first;
    }
    if (first && typeof first === 'object') {
      if (typeof first.image_url === 'string' && first.image_url.trim().length > 0) {
        return first.image_url;
      }
      if (typeof first.url === 'string' && first.url.trim().length > 0) {
        return first.url;
      }
      if (typeof first.src === 'string' && first.src.trim().length > 0) {
        return first.src;
      }
    }
  }

  // 3. image_urls array
  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    const first = product.image_urls[0];
    if (typeof first === 'string' && first.trim().length > 0) {
      return first;
    }
  }

  return DEFAULT_PRODUCT_IMAGE;
};

/**
 * Safely extracts a secondary/hover image URL if available, or returns primary image.
 */
export const getSecondaryProductImageUrl = (product?: any): string => {
  const main = getProductImageUrl(product);
  if (!product) return main;

  if (Array.isArray(product.images) && product.images.length > 1) {
    const second = product.images[1];
    if (typeof second === 'string' && second.trim().length > 0) {
      return second;
    }
    if (second && typeof second === 'object') {
      if (typeof second.image_url === 'string' && second.image_url.trim().length > 0) {
        return second.image_url;
      }
      if (typeof second.url === 'string' && second.url.trim().length > 0) {
        return second.url;
      }
    }
  }

  if (Array.isArray(product.image_urls) && product.image_urls.length > 1) {
    const second = product.image_urls[1];
    if (typeof second === 'string' && second.trim().length > 0) {
      return second;
    }
  }

  return main;
};
