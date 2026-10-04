"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { ShoppingBag, Box, Clipboard, Compass, Plus, Gift, BarChart3 } from "lucide-react";

interface DashboardClientProps {
  products: Product[];
}

export default function DashboardClient({ products }: DashboardClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const totalProducts = products.length;
  const mdfCount = products.filter((p) => p.category === "mdf").length;
  const pouchCount = products.filter((p) => p.category === "pouch").length;
  const magnetCount = products.filter((p) => p.category === "magnet").length;
  const rakhiCount = products.filter((p) => p.category === "rakhis").length;
  const crochetCount = products.filter((p) => p.category === "crochet").length;

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory);

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
    {
      id: "mdf",
      title: "MDF Board Arts",
      value: mdfCount,
      icon: Compass,
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      activeBorder: "border-amber-500",
      activeBg: "bg-amber-500/[0.04]",
      activeRing: "focus:ring-amber-500/40",
    },
    {
      id: "pouch",
      title: "Hand-painted Pouches",
      value: pouchCount,
      icon: ShoppingBag,
      color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      activeBorder: "border-purple-500",
      activeBg: "bg-purple-500/[0.04]",
      activeRing: "focus:ring-purple-500/40",
    },
    {
      id: "magnet",
      title: "Fridge Magnets",
      value: magnetCount,
      icon: Clipboard,
      color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
      activeBorder: "border-rose-500",
      activeBg: "bg-rose-500/[0.04]",
      activeRing: "focus:ring-rose-500/40",
    },
    {
      id: "rakhis",
      title: "Handmade Rakhis",
      value: rakhiCount,
      icon: Gift,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      activeBorder: "border-emerald-500",
      activeBg: "bg-emerald-500/[0.04]",
      activeRing: "focus:ring-emerald-500/40",
    },
    {
      id: "crochet",
      title: "Crochet",
      value: crochetCount,
      icon: Gift,
      color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
      activeBorder: "border-indigo-500",
      activeBg: "bg-indigo-500/[0.04]",
      activeRing: "focus:ring-indigo-500/40",
    },
  ];

  return (
    <div className="space-y-10 text-[#25382E]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5DACB] pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#EC8D99] font-sans">Atelier Overview</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-[#25382E]">Dashboard</h1>
          <p className="text-xs font-sans text-[#5C745F] font-light mt-1">
            Overview of your AaaS handmade crochet collection, stock levels, and atelier catalog.
          </p>
        </div>
        <div className="flex items-center gap-3 font-sans">
          <Link
            href="/admin/analytics"
            className="flex items-center gap-2 bg-[#FFFAF1] hover:bg-[#F8F2E7] text-[#5C745F] hover:text-[#25382E] border border-[#E5DACB] text-xs font-medium uppercase tracking-[0.15em] px-5 py-3 rounded-full transition-all cursor-pointer"
          >
            <BarChart3 size={15} />
            <span>View Analytics</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] text-xs font-medium uppercase tracking-[0.2em] px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Creation</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isActive = selectedCategory === stat.id;
          return (
            <button
              key={stat.id}
              onClick={() => setSelectedCategory(stat.id)}
              className={`w-full text-left bg-[#FFFAF1] rounded-2xl p-4 md:p-5 flex items-center justify-between transition-all duration-200 cursor-pointer border
                ${
                  isActive
                    ? "border-[#25382E] ring-1 ring-[#25382E] shadow-xs"
                    : "border-[#E5DACB] hover:border-[#EC8D99] shadow-[0_2px_10px_rgba(37,56,46,0.02)]"
                }
              `}
              aria-pressed={isActive}
              type="button"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-[#5C745F] font-medium font-sans uppercase tracking-[0.15em] block truncate">
                  {stat.title}
                </span>
                <p className="text-xl md:text-2xl font-serif font-light text-[#25382E]">
                  {stat.value}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-[#F8F2E7] text-[#25382E] shrink-0 border border-[#E5DACB]">
                <Icon size={16} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent Products Table Section */}
      <div className="bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] shadow-[0_2px_12px_rgba(37,56,46,0.03)] overflow-hidden">
        <div className="p-5 md:p-6 border-b border-[#E5DACB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-serif text-xl font-normal text-[#25382E]">
              {selectedCategory === "all"
                ? "Recent Creations"
                : `Recent Creations: ${
                    selectedCategory === "crochet"
                      ? "Handmade Crochet"
                      : selectedCategory === "mdf"
                      ? "MDF Crafts"
                      : selectedCategory === "pouch"
                      ? "Handmade Pouches"
                      : selectedCategory === "rakhis"
                      ? "Artisan Rakhis"
                      : "Crochet Magnets"
                  }`}
            </h2>
            <p className="text-xs text-[#5C745F] font-sans mt-0.5">
              Showing {filteredProducts.length} of {totalProducts} {totalProducts === 1 ? "creation" : "creations"}
            </p>
          </div>
          <Link
            href="/admin/products"
            className="text-xs uppercase tracking-[0.15em] font-medium text-[#EC8D99] hover:text-[#25382E] transition-colors font-sans"
          >
            Manage Catalog
          </Link>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-[#5C745F] font-light text-xs font-sans">
            No creations found in this category.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFFAF1] border-b border-[#E5DACB] text-[10px] uppercase tracking-[0.15em] text-[#5C745F] font-medium font-sans">
                    <th className="py-3.5 px-6">Product</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Price</th>
                    <th className="py-3.5 px-6 text-center">Featured</th>
                    <th className="py-3.5 px-6 text-center">Customizable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DACB] text-xs font-sans text-[#5C745F]">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[#F8F2E7] transition-colors">
                      {/* Image & Title */}
                      <td className="py-3.5 px-6 flex items-center gap-4">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#E5DACB] bg-[#FFFAF1] shrink-0">
                          <Image
                            src={product.image_url}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        </div>
                        <span className="font-serif font-medium text-sm text-[#25382E] hover:text-[#EC8D99] transition-colors">
                          <Link href={`/admin/products`}>{product.title}</Link>
                        </span>
                      </td>
                      {/* Category */}
                      <td className="py-3.5 px-6">
                        <span className="capitalize text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#F6C4C2]/50 text-[#25382E]">
                          {product.category === "crochet"
                            ? "Crochet"
                            : product.category === "mdf"
                            ? "MDF Art"
                            : product.category === "pouch"
                            ? "Pouch"
                            : product.category === "rakhis"
                            ? "Rakhi"
                            : "Magnet"}
                        </span>
                      </td>
                      {/* Price */}
                      <td className="py-3.5 px-6 font-medium text-[#25382E] text-sm">
                        ₹{product.price.toLocaleString("en-IN")}
                      </td>
                      {/* Featured */}
                      <td className="py-3.5 px-6 text-center">
                        {product.featured ? (
                          <span className="inline-block text-[9px] uppercase tracking-wider bg-[#F5C842]/20 text-[#25382E] font-medium px-2.5 py-0.5 rounded-full font-sans">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] uppercase tracking-wider text-[#5C745F]/50 font-sans">
                            No
                          </span>
                        )}
                      </td>
                      {/* Customizable */}
                      <td className="py-3.5 px-6 text-center">
                        {product.customizable ? (
                          <span className="inline-block text-[9px] uppercase tracking-wider bg-[#405F4C]/15 text-[#405F4C] font-medium px-2.5 py-0.5 rounded-full font-sans">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] uppercase tracking-wider text-[#5C745F]/50 font-sans">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-[#E5DACB]">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 flex gap-4 hover:bg-[#F8F2E7] transition-colors items-center font-sans">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#E5DACB] bg-[#FFFAF1] shrink-0">
                    <Image
                      src={product.image_url}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-grow min-w-0 space-y-1">
                    <span className="font-serif font-medium block truncate text-sm text-[#25382E]">
                      <Link href="/admin/products">{product.title}</Link>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="capitalize text-[9px] font-medium px-2 py-0.5 rounded-full bg-[#F6C4C2]/50 text-[#25382E]">
                        {product.category}
                      </span>
                      {product.featured && (
                        <span className="inline-block text-[9px] uppercase tracking-wider bg-[#F5C842]/20 text-[#25382E] font-medium px-1.5 py-0.5 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-[#25382E] text-xs">
                      ₹{product.price.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
