"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { useToast } from "@/components/admin/Toast";
import { Plus, Edit2, Trash2, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCanonicalCategoryName } from "@/lib/constants/categories";

interface ProductsClientProps {
  initialProducts: Product[];
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const handleRowClick = (productId: string, e: React.MouseEvent | React.KeyboardEvent) => {
    // Avoid triggering navigation if user clicks on edit icon or delete button
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) {
      return;
    }
    router.push(`/admin/products/${productId}/edit`);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      // 1. Delete product and its image via protected API route
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete product.");
      }

      // Update state
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      showToast("Product deleted successfully!", "success");
    } catch (error: unknown) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Failed to delete product.", "error");
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-8 text-[#3B241C]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D9C4B0] pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#B58A58] font-sans">Atelier Catalog</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-[#541B1B]">Creations</h1>
          <p className="text-xs font-sans text-[#3B241C]/80 font-light mt-1">
            Manage your boutique creations, adjust pricing, update descriptions, and curate product imagery.
          </p>
        </div>
        {products.length > 0 && (
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-[#541B1B] hover:bg-[#722F37] text-[#FFF9F2] text-xs font-medium uppercase tracking-[0.2em] px-6 py-3.5 rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer font-sans"
          >
            <Plus size={15} />
            <span>Add Creation</span>
          </Link>
        )}
      </div>

      {/* Empty State */}
      {products.length === 0 ? (
        <div className="bg-[#FFF9F2] rounded-2xl border border-[#D9C4B0] border-dashed p-16 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-[#EBCDB8]/40 flex items-center justify-center mx-auto mb-6 text-[#541B1B]">
            <ImageIcon size={26} />
          </div>
          <h3 className="font-serif text-2xl text-[#541B1B] font-normal">No creations yet.</h3>
          <p className="text-[#3B241C]/80 text-xs font-sans font-light mt-2 mb-8 leading-relaxed">
            Get started by adding your first handmade crochet piece, heirloom knit, or artisan accessory.
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-[#541B1B] hover:bg-[#722F37] text-[#FFF9F2] text-xs font-medium uppercase tracking-[0.2em] px-7 py-3.5 rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer font-sans"
          >
            <Plus size={15} />
            <span>Add First Creation</span>
          </Link>
        </div>
      ) : (
        /* Products List (Table layout with responsive styling) */
        <div className="bg-[#FFF9F2] rounded-2xl border border-[#D9C4B0] shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8EEE2] border-b border-[#D9C4B0] text-[10px] uppercase tracking-[0.15em] text-[#8B454B] font-medium font-sans">
                  <th className="py-4 px-6">Creation Info</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9C4B0]/50 text-xs font-sans text-[#3B241C]">
                {products.map((product) => (
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
                    className="hover:bg-[#F8EEE2]/60 transition-all duration-150 cursor-pointer focus:outline-none focus:bg-[#F8EEE2]"
                  >
                    {/* Thumbnail + Title */}
                    <td className="py-4 px-6 flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#D9C4B0] bg-[#F8EEE2] shrink-0">
                        <Image
                          src={product.image_url}
                          alt={product.name || product.title || "Product creation"}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="font-serif font-medium text-sm text-[#541B1B] block line-clamp-1">{product.name || product.title}</span>
                        <span className="text-[10px] text-[#8B454B]/70 font-mono">ID: {product.id}</span>
                      </div>
                    </td>
                    
                    {/* Category */}
                    <td className="py-4 px-6">
                      <span className="capitalize text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#F8EEE2] border border-[#D9C4B0] text-[#541B1B]">
                        {getCanonicalCategoryName(product.category) || product.category}
                      </span>
                    </td>
                    
                    {/* Price */}
                    <td className="py-4 px-6 font-medium text-sm text-[#541B1B]">
                      ₹{product.price.toLocaleString("en-IN")}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-2 text-[#8B454B] hover:text-[#541B1B] hover:bg-[#F8EEE2] rounded-lg transition-all cursor-pointer"
                          title="Edit Creation"
                        >
                          <Edit2 size={15} />
                        </Link>
                        <button
                          onClick={() => setProductToDelete(product)}
                          className="p-2 text-[#8B454B] hover:text-[#A83232] hover:bg-[#A83232]/10 rounded-lg transition-all cursor-pointer"
                          title="Delete Creation"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-[#D9C4B0]/50">
            {products.map((product) => (
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
                className="p-4 flex gap-4 hover:bg-[#F8EEE2]/60 transition-all duration-150 items-start cursor-pointer focus:outline-none focus:bg-[#F8EEE2]"
              >
                {/* image */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#D9C4B0] bg-[#F8EEE2] shrink-0">
                  <Image
                    src={product.image_url}
                    alt={product.name || product.title || "Product creation"}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                {/* Product info */}
                <div className="flex-grow min-w-0 space-y-1">
                  <span className="font-serif font-medium text-[#541B1B] block truncate text-base">{product.name || product.title}</span>
                  <div className="flex flex-wrap items-center gap-1.5 font-sans">
                    <span className="capitalize text-[9px] font-medium px-2 py-0.5 rounded-full bg-[#F8EEE2] border border-[#D9C4B0] text-[#541B1B]">
                      {getCanonicalCategoryName(product.category) || product.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-medium text-[#541B1B] text-xs font-sans">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-1.5 text-[#8B454B] hover:text-[#541B1B] hover:bg-[#F8EEE2] rounded-lg transition-all cursor-pointer"
                        title="Edit Creation"
                      >
                        <Edit2 size={14} />
                      </Link>
                      <button
                        onClick={() => setProductToDelete(product)}
                        className="p-1.5 text-[#8B454B] hover:text-[#A83232] hover:bg-[#A83232]/10 rounded-lg transition-all cursor-pointer"
                        title="Delete Creation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
              className="absolute inset-0 bg-[#3B1018]/40 backdrop-blur-xs"
              onClick={() => !isDeleting && setProductToDelete(null)}
            />
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFF9F2] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#D9C4B0] z-10 relative overflow-hidden font-sans text-[#3B241C]"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-[#A83232]/15 text-[#A83232] shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-2xl font-normal text-[#541B1B]">Delete Creation?</h3>
                  <p className="text-[#3B241C]/80 text-xs font-light leading-relaxed">
                    Are you sure you want to delete <span className="font-medium text-[#541B1B]">&quot;{productToDelete.name || productToDelete.title}&quot;</span>?
                    This will permanently remove the piece from the atelier catalog and delete its photograph from storage.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end gap-3 font-sans">
                <button
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-xs font-medium tracking-[0.15em] text-[#3B241C] hover:bg-[#F8EEE2] border border-[#D9C4B0] uppercase rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-xs font-medium tracking-[0.15em] text-white bg-[#A83232] hover:bg-[#8B2828] uppercase rounded-full shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
