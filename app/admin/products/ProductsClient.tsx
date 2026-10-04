"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { useToast } from "@/components/admin/Toast";
import { Plus, Edit2, Trash2, Check, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="space-y-8 text-[#25382E]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5DACB] pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#EC8D99] font-sans">Atelier Catalog</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-[#25382E]">Creations</h1>
          <p className="text-xs font-sans text-[#5C745F] font-light mt-1">
            Manage your boutique creations, adjust pricing, update descriptions, and curate product imagery.
          </p>
        </div>
        {products.length > 0 && (
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] text-xs font-medium uppercase tracking-[0.2em] px-6 py-3.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer font-sans"
          >
            <Plus size={15} />
            <span>Add Creation</span>
          </Link>
        )}
      </div>

      {/* Empty State */}
      {products.length === 0 ? (
        <div className="bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] border-dashed p-16 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-[#F6C4C2]/30 flex items-center justify-center mx-auto mb-6 text-[#5C745F]">
            <ImageIcon size={26} />
          </div>
          <h3 className="font-serif text-2xl text-[#25382E] font-normal">No creations yet.</h3>
          <p className="text-[#5C745F] text-xs font-sans font-light mt-2 mb-8 leading-relaxed">
            Get started by adding your first handmade crochet piece, custom heirloom knit, or bespoke accessory.
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] text-xs font-medium uppercase tracking-[0.2em] px-7 py-3.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer font-sans"
          >
            <Plus size={15} />
            <span>Add First Creation</span>
          </Link>
        </div>
      ) : (
        /* Products List (Table layout with responsive styling) */
        <div className="bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] shadow-[0_2px_12px_rgba(37,56,46,0.03)] overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F2E7] border-b border-[#E5DACB] text-[10px] uppercase tracking-[0.15em] text-[#5C745F] font-medium font-sans">
                  <th className="py-4 px-6">Creation Info</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6 text-center">Featured</th>
                  <th className="py-4 px-6 text-center">Customizable</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DACB]/50 text-xs font-sans text-[#5C745F]">
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
                    className="hover:bg-[#F8F2E7]/60 transition-all duration-150 cursor-pointer focus:outline-none focus:bg-[#F8F2E7]"
                  >
                    {/* Thumbnail + Title */}
                    <td className="py-4 px-6 flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#E5DACB] bg-[#F8F2E7] shrink-0">
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="font-serif font-medium text-sm text-[#25382E] block line-clamp-1">{product.title}</span>
                        <span className="text-[10px] text-[#5C745F]/60 font-mono">ID: {product.id}</span>
                      </div>
                    </td>
                    
                    {/* Category */}
                    <td className="py-4 px-6">
                      <span className="capitalize text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#F8F2E7] border border-[#E5DACB] text-[#25382E]">
                        {product.category === "crochet" ? "Crochet" : product.category === "mdf" ? "MDF Art" : product.category === "pouch" ? "Pouch" : product.category === "rakhis" ? "Rakhi" : "Magnet"}
                      </span>
                    </td>
                    
                    {/* Price */}
                    <td className="py-4 px-6 font-medium text-sm text-[#25382E]">
                      ₹{product.price.toLocaleString("en-IN")}
                    </td>
                    
                    {/* Featured badge */}
                    <td className="py-4 px-6 text-center">
                      {product.featured ? (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider bg-[#F5C842]/20 text-[#25382E] font-medium px-2.5 py-1 rounded-full border border-[#F5C842]/40">
                          <Check size={10} className="text-[#25382E]" />
                          <span>Featured</span>
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] uppercase tracking-wider text-[#5C745F]/50 font-sans">
                          Standard
                        </span>
                      )}
                    </td>
                    
                    {/* Customizable badge */}
                    <td className="py-4 px-6 text-center">
                      {product.customizable ? (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider bg-[#405F4C]/15 text-[#405F4C] font-medium px-2.5 py-1 rounded-full border border-[#405F4C]/25">
                          <Check size={10} />
                          <span>Customizable</span>
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] uppercase tracking-wider text-[#5C745F]/50 font-sans">
                          Fixed
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-2 text-[#5C745F] hover:text-[#25382E] hover:bg-[#F8F2E7] rounded-lg transition-all cursor-pointer"
                          title="Edit Creation"
                        >
                          <Edit2 size={15} />
                        </Link>
                        <button
                          onClick={() => setProductToDelete(product)}
                          className="p-2 text-[#5C745F] hover:text-[#C96A6A] hover:bg-[#C96A6A]/10 rounded-lg transition-all cursor-pointer"
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
          <div className="block md:hidden divide-y divide-[#E5DACB]/50">
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
                className="p-4 flex gap-4 hover:bg-[#F8F2E7]/60 transition-all duration-150 items-start cursor-pointer focus:outline-none focus:bg-[#F8F2E7]"
              >
                {/* image */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E5DACB] bg-[#F8F2E7] shrink-0">
                  <Image
                    src={product.image_url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                {/* Product info */}
                <div className="flex-grow min-w-0 space-y-1">
                  <span className="font-serif font-medium text-[#25382E] block truncate text-base">{product.title}</span>
                  <div className="flex flex-wrap items-center gap-1.5 font-sans">
                    <span className="capitalize text-[9px] font-medium px-2 py-0.5 rounded-full bg-[#F8F2E7] border border-[#E5DACB] text-[#25382E]">
                      {product.category}
                    </span>
                    {product.featured && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider bg-[#F5C842]/20 text-[#25382E] font-medium px-1.5 py-0.5 rounded-full border border-[#F5C842]/30">
                        <Check size={8} />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-medium text-[#25382E] text-xs font-sans">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-1.5 text-[#5C745F] hover:text-[#25382E] hover:bg-[#F8F2E7] rounded-lg transition-all cursor-pointer"
                        title="Edit Creation"
                      >
                        <Edit2 size={14} />
                      </Link>
                      <button
                        onClick={() => setProductToDelete(product)}
                        className="p-1.5 text-[#5C745F] hover:text-[#C96A6A] hover:bg-[#C96A6A]/10 rounded-lg transition-all cursor-pointer"
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
              className="absolute inset-0 bg-[#25382E]/40 backdrop-blur-xs"
              onClick={() => !isDeleting && setProductToDelete(null)}
            />
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFFAF1] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5DACB] z-10 relative overflow-hidden font-sans text-[#25382E]"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-[#C96A6A]/15 text-[#C96A6A] shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-2xl font-normal text-[#25382E]">Delete Creation?</h3>
                  <p className="text-[#5C745F] text-xs font-light leading-relaxed">
                    Are you sure you want to delete <span className="font-medium text-[#25382E]">&quot;{productToDelete.title}&quot;</span>?
                    This will permanently remove the piece from the atelier catalog and delete its photograph from storage.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end gap-3 font-sans">
                <button
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-xs font-medium tracking-[0.15em] text-[#5C745F] hover:bg-[#F8F2E7] border border-[#E5DACB] uppercase rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-xs font-medium tracking-[0.15em] text-white bg-[#C96A6A] hover:bg-[#B55959] uppercase rounded-full shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
