import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, Category } from "../../types";
import { getProducts, getCategories, updateProductStock } from "../../services/api";
import { useToast } from "../../components/admin/Toast";

export function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Stock Edit Modal
  const [editingStockProduct, setEditingStockProduct] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        getProducts({ limit: 200 }).catch(() => ({ products: [] })),
        getCategories().catch(() => []),
      ]);
      setProducts(prodsRes.products || []);
      setCategories(catsRes || []);
    } catch (err) {
      console.error("Inventory load error:", err);
      showToast("Failed to load inventory.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockProduct) return;

    setIsUpdatingStock(true);
    try {
      await updateProductStock(editingStockProduct.id, newStockValue);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingStockProduct.id ? { ...p, stock_quantity: newStockValue } : p
        )
      );
      showToast(`Stock updated for ${editingStockProduct.name}!`, "success");
      setEditingStockProduct(null);
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.detail || err.message || "Failed to update stock.", "error");
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const nameMatch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const categoryMatch =
      selectedCategory === "all" ||
      product.category_id === selectedCategory ||
      (product.category && (product.category as any).id === selectedCategory) ||
      (typeof product.category === "string" && product.category === selectedCategory);

    const stock = product.stock_quantity ?? 0;
    const threshold = product.low_stock_threshold ?? 3;
    let statusMatch = true;

    if (statusFilter === "in_stock") statusMatch = stock > threshold;
    else if (statusFilter === "low_stock") statusMatch = stock > 0 && stock <= threshold;
    else if (statusFilter === "out_of_stock") statusMatch = stock <= 0;

    return nameMatch && categoryMatch && statusMatch;
  });

  const totalSKUs = products.length;
  const inStockCount = products.filter((p) => (p.stock_quantity ?? 0) > (p.low_stock_threshold ?? 3)).length;
  const lowStockCount = products.filter(
    (p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 3)
  ).length;
  const outOfStockCount = products.filter((p) => (p.stock_quantity ?? 0) <= 0).length;

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-wide text-slate-900">Inventory Hub</h1>
          <p className="text-sm font-sans text-slate-500 font-light mt-1">
            Track stock levels, monitor inventory alerts, and manage product availability.
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-xl shadow-xs transition-all cursor-pointer font-sans"
        >
          <Plus size={16} />
          <span>Add Product</span>
        </Link>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider block">
              Total SKUs
            </span>
            <p className="text-xl md:text-3xl font-serif font-semibold text-slate-800">{totalSKUs}</p>
          </div>
          <div className="p-2 md:p-3 rounded-xl border bg-blue-500/10 text-blue-600 border-blue-500/20 shrink-0">
            <Package size={18} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider block">
              In Stock
            </span>
            <p className="text-xl md:text-3xl font-serif font-semibold text-slate-800">{inStockCount}</p>
          </div>
          <div className="p-2 md:p-3 rounded-xl border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider block">
              Low Stock Alert
            </span>
            <p className="text-xl md:text-3xl font-serif font-semibold text-slate-800">{lowStockCount}</p>
          </div>
          <div className="p-2 md:p-3 rounded-xl border bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider block">
              Out of Stock
            </span>
            <p className="text-xl md:text-3xl font-serif font-semibold text-slate-800">{outOfStockCount}</p>
          </div>
          <div className="p-2 md:p-3 rounded-xl border bg-rose-500/10 text-rose-600 border-rose-500/20 shrink-0">
            <Boxes size={18} />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent placeholder-slate-400 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-accent bg-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-accent bg-white cursor-pointer"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt;3)</option>
              <option value="low_stock">Low Stock (1-3)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col justify-center items-center gap-3 text-slate-400">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm">Loading inventory data...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-light text-sm">
            No products match your inventory filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6 text-center">Stock Level</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((p) => {
                  const stock = p.stock_quantity ?? 0;
                  const threshold = p.low_stock_threshold ?? 3;
                  const imgUrl = p.image_url || p.images?.[0]?.image_url || "/placeholder.png";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Product details */}
                      <td className="py-4 px-6 flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                          <img
                            src={imgUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex flex-col space-y-0.5">
                          <span className="font-semibold text-slate-800 line-clamp-1">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.sku || `ID: ${p.id.substring(0, 8)}`}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 font-medium text-slate-800">
                        ₹{p.price.toLocaleString("en-IN")}
                      </td>

                      {/* Stock quantity */}
                      <td className="py-4 px-6 text-center font-bold text-slate-900">
                        {stock}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6 text-center">
                        {stock <= 0 ? (
                          <span className="inline-block text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200/50">
                            Out of Stock
                          </span>
                        ) : stock <= threshold ? (
                          <span className="inline-block text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200/50">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStockProduct(p);
                              setNewStockValue(p.stock_quantity ?? 0);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Quick Adjust Stock"
                          >
                            <Edit2 size={16} />
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

      {/* Quick Adjust Stock Modal */}
      <AnimatePresence>
        {editingStockProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => !isUpdatingStock && setEditingStockProduct(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 z-10 relative overflow-hidden font-sans"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-slate-800">Adjust Stock</h3>
                  <p className="text-xs text-slate-400 font-light mt-0.5 truncate max-w-[220px]">
                    {editingStockProduct.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStockProduct(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateStock} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="modal-stock" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Units on Hand
                  </label>
                  <input
                    id="modal-stock"
                    type="number"
                    min="0"
                    required
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent font-sans text-sm text-slate-800 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingStockProduct(null)}
                    disabled={isUpdatingStock}
                    className="px-4 py-2 text-xs font-semibold tracking-wider text-slate-500 hover:bg-slate-50 border border-slate-200 uppercase rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStock}
                    className="px-4 py-2 text-xs font-semibold tracking-wider text-white bg-accent hover:bg-accent/90 uppercase rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingStock ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Save Stock</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminInventoryPage;
