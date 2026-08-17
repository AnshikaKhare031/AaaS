import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Save,
  X,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { Product, Category } from '../../types';
import {
  getProducts,
  getCategories,
  updateProductStock,
  deleteProduct,
  createProduct,
  updateProduct,
} from '../../services/api';
import { formatPrice, getStockBadge, formatDate, slugify } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

export const AdminInventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Stock Edit Modal
  const [editingStockProduct, setEditingStockProduct] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);

  // Product Create/Edit Drawer Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    category_id: '',
    description: '',
    price: 899,
    sale_price: null as number | null,
    amazon_asin: '',
    stock_quantity: 10,
    low_stock_threshold: 3,
    material: '100% Premium Milk Cotton Yarn',
    care_instructions: 'Spot clean gently with cold water. Air dry flat.',
    shipping_information: 'Dispatched in 2-4 business days.',
    image_url: '/images/tulip_bouquet.jpg',
    is_active: true,
    is_featured: false,
    is_bestseller: false,
    is_new: true,
  });

  const { success, error } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        getProducts({ limit: 50 }),
        getCategories(),
      ]);
      setProducts(prodRes.products || []);
      setCategories(catRes || []);
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered list
  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCategory !== 'all' && p.category?.slug !== selectedCategory && p.category_id !== selectedCategory) {
      return false;
    }
    if (statusFilter === 'in_stock' && p.stock_quantity <= p.low_stock_threshold) return false;
    if (statusFilter === 'low_stock' && (p.stock_quantity <= 0 || p.stock_quantity > p.low_stock_threshold)) return false;
    if (statusFilter === 'out_of_stock' && p.stock_quantity > 0) return false;
    return true;
  });

  // Handle Quick Stock Update
  const handleSaveStock = async () => {
    if (!editingStockProduct) return;
    try {
      const updated = await updateProductStock(editingStockProduct.id, Math.max(0, newStockValue));
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, stock_quantity: updated.stock_quantity } : p))
      );
      success(`Updated stock for "${editingStockProduct.name}" to ${newStockValue}`);
      setEditingStockProduct(null);
    } catch (err) {
      error('Failed to update stock.');
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      success(`Deleted product "${name}"`);
    } catch (err) {
      error('Failed to delete product.');
    }
  };

  // Open Create/Edit Modal
  const openProductForm = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name,
        slug: prod.slug,
        category_id: prod.category_id || '',
        description: prod.description,
        price: prod.price,
        sale_price: prod.sale_price ?? null,
        amazon_asin: prod.amazon_asin || '',
        stock_quantity: prod.stock_quantity,
        low_stock_threshold: prod.low_stock_threshold,
        material: prod.material,
        care_instructions: prod.care_instructions,
        shipping_information: prod.shipping_information,
        image_url: prod.images?.[0]?.image_url || '/images/tulip_bouquet.jpg',
        is_active: prod.is_active,
        is_featured: prod.is_featured,
        is_bestseller: prod.is_bestseller,
        is_new: prod.is_new,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        slug: '',
        category_id: categories[0]?.id || '',
        description: '',
        price: 899,
        sale_price: null,
        amazon_asin: '',
        stock_quantity: 10,
        low_stock_threshold: 3,
        material: '100% Premium Milk Cotton Yarn',
        care_instructions: 'Spot clean gently with cold water. Air dry flat.',
        shipping_information: 'Dispatched in 2-4 business days.',
        image_url: '/images/tulip_bouquet.jpg',
        is_active: true,
        is_featured: false,
        is_bestseller: false,
        is_new: true,
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Product> = {
        ...productForm,
        slug: productForm.slug || slugify(productForm.name),
        images: [{ id: 'img-1', product_id: '', image_url: productForm.image_url, display_order: 1 }],
      };

      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        success(`Product "${productForm.name}" updated.`);
      } else {
        const created = await createProduct(payload);
        setProducts((prev) => [created, ...prev]);
        success(`New product "${productForm.name}" created.`);
      }
      setIsProductModalOpen(false);
    } catch (err) {
      error('Failed to save product details.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#C6A15B]" />
            <h1 className="font-serif text-3xl font-bold text-[#3D2E24]">Inventory Hub</h1>
          </div>
          <p className="text-xs text-[#7B6656] mt-1">
            Manage live boutique stock, product prices, descriptions, and catalog visibility.
          </p>
        </div>

        <button
          onClick={() => openProductForm()}
          className="px-5 py-2.5 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E7DFD7] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#7B6656] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product name or slug..."
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl px-3 py-2 text-xs font-semibold text-[#5A4335] focus:outline-none focus:border-[#C6A15B]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl px-3 py-2 text-xs font-semibold text-[#5A4335] focus:outline-none focus:border-[#C6A15B]"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-[#E7DFD7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#5A4335]">
            <thead className="bg-[#F8F5F0] border-b border-[#E7DFD7] text-[#7B6656] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DFD7]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-[#7B6656]">
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-[#7B6656]">
                    No inventory items matched your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const stockBadge = getStockBadge(prod.stock_quantity, prod.low_stock_threshold);
                  const currentPrice = prod.sale_price ?? prod.price;

                  return (
                    <tr key={prod.id} className="hover:bg-[#F8F5F0]/60 transition-colors">
                      {/* Product Name & Image */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images?.[0]?.image_url || '/images/tulip_bouquet.jpg'}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg object-cover bg-[#F8F5F0] border border-[#E7DFD7] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-serif text-sm font-bold text-[#3D2E24] truncate">
                              {prod.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-[10px] text-[#7B6656]">{prod.slug}</p>
                              {prod.amazon_asin && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#EADCCF]/80 text-[#5A4335]">
                                  ASIN: {prod.amazon_asin}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-[#7B6656]">
                        {prod.category?.name || 'Uncategorized'}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 font-bold text-[#3D2E24]">
                        {formatPrice(currentPrice)}
                      </td>

                      {/* Stock Level with Quick Click */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setEditingStockProduct(prod);
                            setNewStockValue(prod.stock_quantity);
                          }}
                          className="flex items-center gap-2 px-2.5 py-1 bg-[#F8F5F0] hover:bg-[#EADCCF] border border-[#E7DFD7] rounded-lg font-bold text-[#3D2E24] transition-colors"
                          title="Click to adjust stock"
                        >
                          <span>{prod.stock_quantity} units</span>
                          <Edit2 className="w-3 h-3 text-[#7B6656]" />
                        </button>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${stockBadge.color}`}
                        >
                          {stockBadge.label}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="px-6 py-4 text-[#7B6656]">
                        {formatDate(prod.updated_at || prod.created_at)}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/product/${prod.slug}`}
                            target="_blank"
                            className="p-1.5 text-[#7B6656] hover:text-[#C6A15B] rounded-lg hover:bg-white transition-colors"
                            title="View on live store"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => openProductForm(prod)}
                            className="p-1.5 text-[#5A4335] hover:text-[#C6A15B] rounded-lg hover:bg-white transition-colors"
                            title="Edit product details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 text-[#7B6656] hover:text-[#C96A6A] rounded-lg hover:bg-white transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stock Adjustment Modal */}
      {editingStockProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E7DFD7] p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#3D2E24]">Adjust Stock Level</h3>
              <button
                onClick={() => setEditingStockProduct(null)}
                className="p-1 text-[#7B6656] hover:text-[#3D2E24]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#7B6656]">
              Product: <strong className="text-[#3D2E24]">{editingStockProduct.name}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#5A4335] mb-1">Stock Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewStockValue(Math.max(0, newStockValue - 1))}
                  className="px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl font-bold hover:bg-[#EADCCF]"
                >
                  -1
                </button>
                <input
                  type="number"
                  min="0"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(Number(e.target.value))}
                  className="w-full text-center py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl font-bold text-[#3D2E24]"
                />
                <button
                  type="button"
                  onClick={() => setNewStockValue(newStockValue + 1)}
                  className="px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl font-bold hover:bg-[#EADCCF]"
                >
                  +1
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveStock}
                className="flex-1 py-2.5 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24]"
              >
                Save Stock
              </button>
              <button
                onClick={() => setEditingStockProduct(null)}
                className="px-4 py-2.5 border border-[#E7DFD7] text-xs font-semibold text-[#7B6656] rounded-xl hover:bg-[#F8F5F0]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Full Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E7DFD7] p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#E7DFD7] pb-4">
              <h3 className="font-serif text-2xl font-bold text-[#3D2E24]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-[#7B6656] hover:text-[#3D2E24]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#5A4335] mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setProductForm({
                        ...productForm,
                        name,
                        slug: slugify(name),
                      });
                    }}
                    placeholder="e.g. Crochet Lavender Bouquet"
                    className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#5A4335] mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={productForm.slug}
                    onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[#5A4335] mb-1">Category</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#5A4335] mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#5A4335] mb-1">Sale Price (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.sale_price || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        sale_price: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="e.g. 799"
                    className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[#5A4335] mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock_quantity}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock_quantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#5A4335] mb-1">Amazon ASIN (Optional)</label>
                  <input
                    type="text"
                    value={productForm.amazon_asin}
                    onChange={(e) => setProductForm({ ...productForm, amazon_asin: e.target.value })}
                    placeholder="e.g. B0CXXXXXXX"
                    className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#5A4335] mb-1">Image URL / Path</label>
                  <input
                    type="text"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#5A4335] mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                    className="rounded text-[#5A4335]"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })}
                    className="rounded text-[#5A4335]"
                  />
                  <span>Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_bestseller}
                    onChange={(e) =>
                      setProductForm({ ...productForm, is_bestseller: e.target.checked })
                    }
                    className="rounded text-[#5A4335]"
                  />
                  <span>Bestseller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_new}
                    onChange={(e) => setProductForm({ ...productForm, is_new: e.target.checked })}
                    className="rounded text-[#5A4335]"
                  />
                  <span>New Drop</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E7DFD7]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 border border-[#E7DFD7] text-[#7B6656] font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5A4335] text-white font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24]"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
