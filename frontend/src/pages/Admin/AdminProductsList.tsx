import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  CheckCircle2,
  XCircle,
  Star,
  ExternalLink,
  AlertTriangle,
  Boxes,
  Eye,
} from 'lucide-react';
import { Product, Category } from '../../types';
import {
  getAdminProducts,
  getCategories,
  updateProductQuickStatus,
  deleteProduct,
} from '../../services/api';
import { formatPrice, getProductImageUrl, DEFAULT_PRODUCT_IMAGE } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

export const AdminProductsListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Delete modal state
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        getAdminProducts({
          search: search || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        getCategories(),
      ]);
      setProducts(prodsData);
      setCategories(catsData);
    } catch (err: any) {
      toastError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Optimistic toggle for is_active
  const handleToggleActive = async (product: Product) => {
    const nextState = !product.is_active;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: nextState } : p))
    );

    try {
      await updateProductQuickStatus(product.id, { is_active: nextState });
      success(`Product marked as ${nextState ? 'Active' : 'Inactive'}`);
    } catch (err) {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: !nextState } : p))
      );
      toastError('Failed to update product status');
    }
  };

  // Optimistic toggle for is_featured
  const handleToggleFeatured = async (product: Product) => {
    const nextState = !product.is_featured;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_featured: nextState } : p))
    );

    try {
      await updateProductQuickStatus(product.id, { is_featured: nextState });
      success(`Product ${nextState ? 'featured on storefront' : 'removed from featured'}`);
    } catch (err) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_featured: !nextState } : p))
      );
      toastError('Failed to update featured status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deletingProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      success('Product deleted successfully');
      setDeletingProduct(null);
    } catch (err) {
      toastError('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2E24] flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-[#C6A15B]" /> Products Catalog
          </h1>
          <p className="text-xs text-[#7B6656] mt-1">
            Manage your boutique creations, inventory quantities, pricing, and showcase status
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7DFD7] shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#7B6656] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, SKU, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-xs text-[#3D2E24] focus:outline-hidden focus:ring-2 focus:ring-[#C6A15B]"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#7B6656]">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-xs text-[#3D2E24] focus:outline-hidden focus:ring-2 focus:ring-[#C6A15B]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-xs text-[#3D2E24] focus:outline-hidden focus:ring-2 focus:ring-[#C6A15B]"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#7B6656]">Loading boutique collection...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Boxes className="w-12 h-12 text-[#EADCCF] mx-auto mb-3" />
            <p className="font-serif text-lg font-bold text-[#3D2E24]">No products match your filters</p>
            <p className="text-xs text-[#7B6656] mt-1">Try resetting the search terms or add a new piece to the catalog.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E7DFD7] bg-[#FAF7F2] text-[11px] font-bold text-[#5A4335] uppercase tracking-wider">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DFD7] text-xs">
                {products.map((p) => {
                  const thumbnail = getProductImageUrl(p);
                  const stock = p.inventory_count ?? p.stock_quantity;
                  const isLow = stock <= (p.low_stock_threshold || 3);

                  return (
                    <tr key={p.id} className="hover:bg-[#F8F5F0]/50 transition-colors">
                      {/* Product details & thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumbnail}
                            alt={p.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                            }}
                            className="w-12 h-12 rounded-xl object-cover border border-[#E7DFD7] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-[#3D2E24] truncate">{p.name}</p>
                            <span className="text-[10px] text-[#7B6656] font-mono">
                              /{p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono text-xs text-[#5A4335]">
                        {p.sku || `AAAS-${p.id.slice(0, 6).toUpperCase()}`}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-[#7B6656]">
                        {p.category?.name || 'Uncategorized'}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#3D2E24]">
                            {formatPrice(p.sale_price || p.price)}
                          </span>
                          {(p.compare_at_price || p.sale_price) && (
                            <span className="text-[10px] text-[#7B6656] line-through">
                              {formatPrice(p.price)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Count */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            stock <= 0
                              ? 'bg-[#C96A6A]/15 text-[#C96A6A]'
                              : isLow
                              ? 'bg-[#E5B869]/20 text-[#A67B28]'
                              : 'bg-[#8FA57D]/15 text-[#5C734B]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              stock <= 0
                                ? 'bg-[#C96A6A]'
                                : isLow
                                ? 'bg-[#E5B869]'
                                : 'bg-[#8FA57D]'
                            }`}
                          />
                          {stock} in stock
                        </span>
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(p)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            p.is_featured
                              ? 'text-[#C6A15B] bg-[#C6A15B]/10 hover:bg-[#C6A15B]/20'
                              : 'text-[#7B6656]/40 hover:text-[#C6A15B]'
                          }`}
                          title={p.is_featured ? 'Featured on store' : 'Click to feature'}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            p.is_active
                              ? 'bg-[#8FA57D]/15 text-[#5C734B] hover:bg-[#8FA57D]/25'
                              : 'bg-[#7B6656]/15 text-[#7B6656] hover:bg-[#7B6656]/25'
                          }`}
                        >
                          {p.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/product/${p.slug}`}
                            target="_blank"
                            className="p-1.5 text-[#7B6656] hover:text-[#3D2E24] hover:bg-[#FAF7F2] rounded-lg transition-colors"
                            title="Preview on live storefront"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className="p-1.5 text-[#7B6656] hover:text-[#5A4335] hover:bg-[#FAF7F2] rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="p-1.5 text-[#7B6656] hover:text-[#C96A6A] hover:bg-[#C96A6A]/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E7DFD7] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#C96A6A]/15 text-[#C96A6A] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">Delete Product</h3>
              <p className="text-xs text-[#7B6656] mt-1">
                Are you sure you want to permanently delete{' '}
                <strong className="text-[#3D2E24]">"{deletingProduct.name}"</strong>? This action
                cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-[#FAF7F2] hover:bg-[#EADCCF]/50 text-[#5A4335] text-xs font-bold rounded-xl border border-[#E7DFD7] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-[#C96A6A] hover:bg-[#B35858] text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
