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
