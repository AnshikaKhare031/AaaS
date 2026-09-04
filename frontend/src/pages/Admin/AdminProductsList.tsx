import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Check, AlertTriangle, Image as ImageIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "../../types";
import { getAdminProducts, deleteProduct } from "../../services/api";
import { useToast } from "../../components/admin/Toast";

export function AdminProductsListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts();
      setProducts(data || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      showToast("Failed to load products.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRowClick = (productId: string, e: React.MouseEvent | React.KeyboardEvent) => {
    // Avoid triggering navigation if user clicks on edit icon or delete button
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) {
      return;
    }
    navigate(`/admin/products/${productId}/edit`);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      showToast("Product deleted successfully!", "success");
    } catch (error: any) {
      console.error(error);
      showToast(error?.response?.data?.detail || error.message || "Failed to delete product.", "error");
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-wide text-slate-900">Products</h1>
          <p className="text-sm font-sans text-slate-500 font-light mt-1">
            Manage your store creations, edit prices, descriptions, and upload images.
          </p>
        </div>
        {products.length > 0 && (
          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-xl shadow-xs transition-all cursor-pointer font-sans"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="p-16 flex flex-col justify-center items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm">Loading products catalog...</span>
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-16 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="text-slate-400" size={28} />
          </div>
          <h3 className="font-serif text-2xl text-slate-800 font-medium">No products yet.</h3>
          <p className="text-slate-500 text-sm font-sans font-light mt-2 mb-8 leading-relaxed">
            Get started by adding your first handmade crochet, jewellery, or home decor creation.
          </p>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer font-sans"
          >
            <Plus size={16} />
            <span>Add First Product</span>
          </Link>
        </div>
      ) : (
        /* Products List (Table layout with responsive styling) */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-sans">
                  <th className="py-4 px-6">Product Info</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6 text-center">Featured</th>
                  <th className="py-4 px-6 text-center">Customizable</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-sans text-slate-700">
                {products.map((product) => {
                  const imgUrl = product.image_url || product.images?.[0]?.image_url || "/placeholder.png";
                  const catName = product.category?.name || (typeof product.category === "string" ? product.category : "") || "General";
                  return (
                    <tr
                      key={product.id}
                      onClick={(e) => handleRowClick(product.id, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRowClick(product.id, e);
                        }
                      }}
                      tabIndex={0}
                      className="hover:bg-slate-50/60 transition-all duration-150 cursor-pointer focus:outline-none focus:bg-slate-50/80 focus:ring-2 focus:ring-accent/20"
                    >
                      {/* Thumbnail + Title */}
                      <td className="py-4 px-6 flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                          <img
                            src={imgUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="font-semibold text-slate-800 block line-clamp-1">{product.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono tracking-tighter">ID: {product.id}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="capitalize text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          {catName}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 font-medium text-slate-800">
                        ₹{product.price.toLocaleString("en-IN")}
                      </td>

                      {/* Featured badge */}
                      <td className="py-4 px-6 text-center">
                        {product.is_featured ? (
                          <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider bg-amber-500/10 text-amber-700 font-semibold px-2.5 py-1 rounded-sm">
                            <Check size={10} />
                            <span>Featured</span>
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] uppercase tracking-wider bg-slate-100 text-slate-400 font-medium px-2.5 py-1 rounded-sm">
                            Standard
                          </span>
                        )}
                      </td>

                      {/* Customizable badge */}
                      <td className="py-4 px-6 text-center">
                        {product.is_customizable ? (
                          <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider bg-purple-500/10 text-purple-700 font-semibold px-2.5 py-1 rounded-sm">
                            <Check size={10} />
                            <span>Customizable</span>
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] uppercase tracking-wider bg-slate-100 text-slate-400 font-medium px-2.5 py-1 rounded-sm">
                            Fixed
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {products.map((product) => {
              const imgUrl = product.image_url || product.images?.[0]?.image_url || "/placeholder.png";
              const catName = product.category?.name || (typeof product.category === "string" ? product.category : "") || "General";
              return (
                <div
                  key={product.id}
                  onClick={(e) => handleRowClick(product.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(product.id, e);
                    }
                  }}
                  tabIndex={0}
                  className="p-4 flex gap-4 hover:bg-slate-50/60 transition-all duration-150 items-start cursor-pointer focus:outline-none focus:bg-slate-50/80 focus:ring-2 focus:ring-accent/20"
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                    <img
                      src={imgUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-grow min-w-0 space-y-1.5">
                    <span className="font-semibold text-slate-800 block truncate text-base">{product.name}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="capitalize text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {catName}
                      </span>
                      {product.is_featured && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider bg-amber-500/10 text-amber-700 font-semibold px-1.5 py-0.5 rounded-sm">
                          <Check size={8} />
                          <span>Featured</span>
                        </span>
                      )}
                      {product.is_customizable && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider bg-purple-500/10 text-purple-700 font-semibold px-1.5 py-0.5 rounded-sm">
                          <Check size={8} />
                          <span>Customizable</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-semibold text-slate-800 text-sm">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(product)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => !isDeleting && setProductToDelete(null)}
            />
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 z-10 relative overflow-hidden font-sans"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-rose-50 text-rose-600 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-semibold text-slate-800">Delete Product?</h3>
                  <p className="text-slate-500 text-sm font-sans font-light leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-slate-800">&quot;{productToDelete.name}&quot;</span>?
                    This will permanently remove the product from the catalog.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold tracking-wider text-slate-500 hover:bg-slate-50 border border-slate-200 uppercase rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold tracking-wider text-white bg-rose-600 hover:bg-rose-700 uppercase rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminProductsListPage;
