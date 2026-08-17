import axios from 'axios';
import {
  Product,
  Category,
  CartItem,
  WishlistItem,
  CustomOrder,
  Review,
  AdminSettings,
  AdminDashboardMetrics,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Supabase auth JWT token if available
apiClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('aaas_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Products API
export const getProducts = async (params?: {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  in_stock?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; total: number; page: number; total_pages: number }> => {
  const response = await apiClient.get('/products', { params });
  return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
};

export const getProductBySlug = async (slug: string): Promise<Product> => {
  const response = await apiClient.get(`/products/slug/${slug}`);
  return response.data;
};

export const createProduct = async (productData: Partial<Product>): Promise<Product> => {
  const response = await apiClient.post('/admin/products', productData);
  return response.data;
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  const response = await apiClient.put(`/admin/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/admin/products/${id}`);
  return response.data;
};

// Categories API
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get('/categories');
  return response.data;
};

export const createCategory = async (data: Partial<Category>): Promise<Category> => {
  const response = await apiClient.post('/admin/categories', data);
  return response.data;
};

export const updateCategory = async (id: string, data: Partial<Category>): Promise<Category> => {
  const response = await apiClient.put(`/admin/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: string): Promise<{ success: boolean }> => {
  const response = await apiClient.delete(`/admin/categories/${id}`);
  return response.data;
};

// Inventory API
export const getInventory = async (params?: {
  search?: string;
  category?: string;
  status?: string;
}): Promise<Product[]> => {
  const response = await apiClient.get('/admin/inventory', { params });
  return response.data;
};

export const updateProductStock = async (
  productId: string,
  stockQuantity: number
): Promise<Product> => {
  const response = await apiClient.put(`/admin/inventory/${productId}`, {
    stock_quantity: stockQuantity,
  });
  return response.data;
};

export const adjustProductStock = async (
  productId: string,
  delta: number,
  reason?: string
): Promise<Product> => {
  const response = await apiClient.post(`/admin/inventory/${productId}/adjust`, {
    delta,
    reason,
  });
  return response.data;
};

// Cart API (For authenticated users)
export const getCart = async (): Promise<CartItem[]> => {
  const response = await apiClient.get('/cart');
  return response.data;
};

export const addToCart = async (productId: string, quantity: number = 1): Promise<CartItem> => {
  const response = await apiClient.post('/cart', { product_id: productId, quantity });
  return response.data;
};

export const updateCartItemQuantity = async (
  itemId: string,
  quantity: number
): Promise<CartItem> => {
  const response = await apiClient.put(`/cart/${itemId}`, { quantity });
  return response.data;
};

export const removeCartItem = async (itemId: string): Promise<{ success: boolean }> => {
  const response = await apiClient.delete(`/cart/${itemId}`);
  return response.data;
};

export const clearCart = async (): Promise<{ success: boolean }> => {
  const response = await apiClient.delete('/cart/clear');
  return response.data;
};

// Wishlist API
export const getWishlist = async (): Promise<WishlistItem[]> => {
  const response = await apiClient.get('/wishlist');
  return response.data;
};

export const addToWishlist = async (productId: string): Promise<WishlistItem> => {
  const response = await apiClient.post('/wishlist', { product_id: productId });
  return response.data;
};

export const removeFromWishlist = async (productId: string): Promise<{ success: boolean }> => {
  const response = await apiClient.delete(`/wishlist/${productId}`);
  return response.data;
};


// Custom Orders API
export const createCustomOrder = async (data: {
  name: string;
  email: string;
  phone: string;
  product_type: string;
  category?: string;
  color_preference?: string;
  size_dimensions?: string;
  quantity: number;
  budget?: number;
  description: string;
  images?: string[];
}): Promise<CustomOrder> => {
  const response = await apiClient.post('/custom-orders', data);
  return response.data;
};

export const getCustomOrders = async (): Promise<CustomOrder[]> => {
  const response = await apiClient.get('/custom-orders');
  return response.data;
};

export const getCustomOrderById = async (id: string): Promise<CustomOrder> => {
  const response = await apiClient.get(`/custom-orders/${id}`);
  return response.data;
};

// Admin Custom Orders
export const getAdminCustomOrders = async (): Promise<CustomOrder[]> => {
  const response = await apiClient.get('/admin/custom-orders');
  return response.data;
};

export const updateCustomOrderStatus = async (
  id: string,
  status: string,
  adminNotes?: string
): Promise<CustomOrder> => {
  const response = await apiClient.put(`/admin/custom-orders/${id}/status`, {
    status,
    admin_notes: adminNotes,
  });
  return response.data;
};


// Reviews API
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  const response = await apiClient.get(`/products/${productId}/reviews`);
  return response.data;
};

export const submitReview = async (reviewData: {
  product_id: string;
  rating: number;
  comment: string;
  customer_name: string;
}): Promise<Review> => {
  const response = await apiClient.post('/reviews', reviewData);
  return response.data;
};

export const getAdminReviews = async (): Promise<Review[]> => {
  const response = await apiClient.get('/admin/reviews');
  return response.data;
};

export const updateReviewStatus = async (
  id: string,
  isApproved: boolean
): Promise<Review> => {
  const response = await apiClient.put(`/admin/reviews/${id}/status`, {
    is_approved: isApproved,
  });
  return response.data;
};

// Admin Settings & Dashboard Metrics
export const getAdminSettings = async (): Promise<AdminSettings> => {
  const response = await apiClient.get('/admin/settings');
  return response.data;
};

export const updateAdminSettings = async (
  settings: Partial<AdminSettings>
): Promise<AdminSettings> => {
  const response = await apiClient.put('/admin/settings', settings);
  return response.data;
};

export const getDashboardMetrics = async (): Promise<AdminDashboardMetrics> => {
  const response = await apiClient.get('/admin/dashboard');
  return response.data;
};
