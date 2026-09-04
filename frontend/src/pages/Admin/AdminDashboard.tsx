import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Product } from "../../types";
import { ShoppingBag, Box, Clipboard, Compass, Plus, Gift, BarChart3, Loader2 } from "lucide-react";
import { getAdminProducts } from "../../services/api";

export function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const prods = await getAdminProducts();
        setProducts(prods || []);
      } catch (err) {
        console.error("Dashboard products load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalProducts = products.length;

  // Extract top 4 categories from products
  const categoryCountMap = new Map<string, number>();
  products.forEach((p) => {
    const cat = p.category?.name || (typeof p.category === "string" ? p.category : "") || "Bouquets";
    categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + 1);
  });

  const sortedCategories = Array.from(categoryCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Fallback category labels if products are few
  const defaultCategoryConfigs = [
    {
      id: sortedCategories[0]?.[0] || "bouquets",
      title: sortedCategories[0]?.[0] || "Bouquets",
      value: sortedCategories[0]?.[1] || 0,
      icon: Compass,
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      activeBorder: "border-amber-500",
      activeBg: "bg-amber-500/[0.04]",
      activeRing: "focus:ring-amber-500/40",
    },
    {
      id: sortedCategories[1]?.[0] || "handbags",
      title: sortedCategories[1]?.[0] || "Handbags",
      value: sortedCategories[1]?.[1] || 0,
      icon: ShoppingBag,
      color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      activeBorder: "border-purple-500",
      activeBg: "bg-purple-500/[0.04]",
      activeRing: "focus:ring-purple-500/40",
    },
    {
      id: sortedCategories[2]?.[0] || "accessories",
      title: sortedCategories[2]?.[0] || "Accessories",
      value: sortedCategories[2]?.[1] || 0,
      icon: Clipboard,
      color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
      activeBorder: "border-rose-500",
      activeBg: "bg-rose-500/[0.04]",
      activeRing: "focus:ring-rose-500/40",
    },
    {
      id: sortedCategories[3]?.[0] || "decor",
      title: sortedCategories[3]?.[0] || "Home Decor",
      value: sortedCategories[3]?.[1] || 0,
      icon: Gift,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      activeBorder: "border-emerald-500",
      activeBg: "bg-emerald-500/[0.04]",
      activeRing: "focus:ring-emerald-500/40",
    },
  ];

  const stats = [
    {
      id: "all",
      title: "Total Products",
      value: totalProducts,
      icon: Box,
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      activeBorder: "border-blue-500",
      activeBg: "bg-blue-500/[0.04]",
      activeRing: "focus:ring-blue-500/40",
    },
    ...defaultCategoryConfigs,
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => {
          const cat = p.category?.name || (typeof p.category === "string" ? p.category : "") || "";
          return cat.toLowerCase() === selectedCategory.toLowerCase();
        });

  return (
    <div className="space-y-10 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-wide text-slate-900">Dashboard</h1>
          <p className="text-sm font-sans text-slate-500 font-light mt-1">
            Overview of your AaaS Studio store catalog and inventory.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/analytics"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-xl shadow-xs transition-all cursor-pointer font-sans"
          >
            <BarChart3 size={16} />
            <span>View Full Analytics</span>
          </Link>
          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-xl shadow-xs transition-all cursor-pointer font-sans"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isActive = selectedCategory === stat.id;
          return (
            <button
              key={stat.id}
              onClick={() => setSelectedCategory(stat.id)}
              className={`w-full text-left bg-white rounded-2xl p-4 md:p-6 flex items-center justify-between transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${stat.activeRing} border
                ${
                  isActive
                    ? `${stat.activeBorder} ${stat.activeBg} shadow-md scale-[1.02]`
                    : "border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.99]"
                }
              `}
              aria-pressed={isActive}
              type="button"
            >
              <div className="space-y-1">
                <span className="text-[10px] md:text-xs text-slate-400 font-medium font-sans uppercase tracking-wider block">
                  {stat.title}
                </span>
                <p className="text-xl md:text-3xl font-serif font-semibold text-slate-800">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 md:p-3 rounded-xl border ${stat.color} shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                <Icon size={18} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent Products Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-serif text-lg md:text-xl font-semibold text-slate-800">
              {selectedCategory === "all"
                ? "Recent Creations"
                : `Recent Creations: ${
                    stats.find((s) => s.id === selectedCategory)?.title || selectedCategory
                  }`}
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Showing {filteredProducts.length} of {totalProducts} {totalProducts === 1 ? "product" : "products"}
            </p>
          </div>
          <Link
            to="/admin/products"
            className="text-xs uppercase tracking-wider font-semibold text-accent hover:text-accent/80 transition-colors font-sans"
          >
            View All Products
          </Link>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-sans">
            <Loader2 className="animate-spin" size={18} />
            <span>Loading creations...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-light text-sm font-sans">
            No products in this category yet.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-sans">
                    <th className="py-4 px-6">Product</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6 text-center">Featured</th>
                    <th className="py-4 px-6 text-center">Customizable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-sans text-slate-700">
                  {filteredProducts.map((product) => {
                    const imgUrl = product.image_url || product.images?.[0]?.image_url || "/placeholder.png";
                    const cat = product.category?.name || (typeof product.category === "string" ? product.category : "") || "General";
                    return (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Image & Title */}
                        <td className="py-4 px-6 flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                            <img
                              src={imgUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <span className="font-medium text-slate-800 hover:text-accent transition-colors font-sans">
                            <Link to="/admin/products">{product.name}</Link>
                          </span>
                        </td>
                        {/* Category */}
                        <td className="py-4 px-6">
                          <span className="capitalize text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                            {cat}
                          </span>
                        </td>
                        {/* Price */}
                        <td className="py-4 px-6 font-medium text-slate-800">
                          ₹{product.price.toLocaleString("en-IN")}
                        </td>
                        {/* Featured */}
                        <td className="py-4 px-6 text-center">
                          {product.is_featured ? (
                            <span className="inline-block text-[9px] uppercase tracking-wider bg-amber-500/10 text-amber-700 font-semibold px-2.5 py-0.5 rounded-sm font-sans">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-block text-[9px] uppercase tracking-wider bg-slate-100 text-slate-400 font-semibold px-2.5 py-0.5 rounded-sm font-sans">
                              No
                            </span>
                          )}
                        </td>
                        {/* Customizable */}
                        <td className="py-4 px-6 text-center">
                          {product.is_customizable ? (
                            <span className="inline-block text-[9px] uppercase tracking-wider bg-purple-500/10 text-purple-700 font-semibold px-2.5 py-0.5 rounded-sm font-sans">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-block text-[9px] uppercase tracking-wider bg-slate-100 text-slate-400 font-semibold px-2.5 py-0.5 rounded-sm font-sans">
                              No
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const imgUrl = product.image_url || product.images?.[0]?.image_url || "/placeholder.png";
                const cat = product.category?.name || (typeof product.category === "string" ? product.category : "") || "General";
                return (
                  <div key={product.id} className="p-4 flex gap-4 hover:bg-slate-50/50 transition-colors items-center font-sans">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
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
                      <span className="font-semibold text-slate-800 block truncate text-sm">
                        <Link to="/admin/products">{product.name}</Link>
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="capitalize text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {cat}
                        </span>
                        {product.is_featured && (
                          <span className="inline-block text-[9px] uppercase tracking-wider bg-amber-500/10 text-amber-700 font-semibold px-1.5 py-0.5 rounded-sm">
                            Featured
                          </span>
                        )}
                        {product.is_customizable && (
                          <span className="inline-block text-[9px] uppercase tracking-wider bg-purple-500/10 text-purple-700 font-semibold px-1.5 py-0.5 rounded-sm">
                            Customizable
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-800 text-xs">
                        ₹{product.price.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
