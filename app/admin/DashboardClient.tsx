"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { ShoppingBag, Box, Compass, Plus, Gift, BarChart3 } from "lucide-react";
import { matchesCategory, getCanonicalCategoryName } from "@/lib/constants/categories";

interface DashboardClientProps {
  products: Product[];
}

export default function DashboardClient({ products }: DashboardClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const totalProducts = products.length;
  const handbagsCount = products.filter((p) => matchesCategory(p.category, "handbags")).length;
  const keychainsCount = products.filter((p) => matchesCategory(p.category, "keychains")).length;
  const accessoriesCount = products.filter((p) => matchesCategory(p.category, "accessories")).length;

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => matchesCategory(product.category, selectedCategory));

  const stats = [
    {
      id: "all",
      title: "Total Creations",
      value: totalProducts,
      icon: Box,
    },
    {
      id: "handbags",
      title: "Handbags",
      value: handbagsCount,
      icon: ShoppingBag,
    },
    {
      id: "keychains",
      title: "Keychains",
      value: keychainsCount,
      icon: Gift,
    },
    {
      id: "accessories",
      title: "Accessories",
      value: accessoriesCount,
      icon: Compass,
    },
  ];

  return (
    <div className="space-y-10 text-[#3B241C]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D9C4B0] pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#B58A58] font-sans">Atelier Overview</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-[#541B1B]">Dashboard</h1>
          <p className="text-xs font-sans text-[#3B241C]/80 font-light mt-1">
            Overview of your AaaS handmade crochet collection, stock levels, and atelier catalog.
          </p>
        </div>
        <div className="flex items-center gap-3 font-sans">
          <Link
            href="/admin/analytics"
            className="flex items-center gap-2 bg-[#FFF9F2] hover:bg-[#F8EEE2] text-[#3B241C] hover:text-[#541B1B] border border-[#D9C4B0] text-xs font-medium uppercase tracking-[0.15em] px-5 py-3 rounded-full transition-all cursor-pointer"
          >
            <BarChart3 size={15} />
            <span>View Analytics</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-[#541B1B] hover:bg-[#722F37] text-[#FFF9F2] text-xs font-medium uppercase tracking-[0.2em] px-6 py-3 rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Creation</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isActive = selectedCategory === stat.id;
          return (
            <button
              key={stat.id}
              onClick={() => setSelectedCategory(stat.id)}
              className={`w-full text-left bg-[#FFF9F2] rounded-2xl p-4 md:p-5 flex items-center justify-between transition-all duration-200 cursor-pointer border
                ${
                  isActive
                    ? "border-[#541B1B] ring-1 ring-[#541B1B] shadow-xs"
                    : "border-[#D9C4B0] hover:border-[#8B454B] shadow-xs"
                }
              `}
              aria-pressed={isActive}
              type="button"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-[#8B454B] font-medium font-sans uppercase tracking-[0.15em] block truncate">
                  {stat.title}
                </span>
                <p className="text-xl md:text-2xl font-serif font-light text-[#541B1B]">
                  {stat.value}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-[#F8EEE2] text-[#541B1B] shrink-0 border border-[#D9C4B0]">
                <Icon size={16} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent Products Table Section */}
      <div className="bg-[#FFF9F2] rounded-2xl border border-[#D9C4B0] shadow-xs overflow-hidden">
        <div className="p-5 md:p-6 border-b border-[#D9C4B0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-serif text-xl font-normal text-[#541B1B]">
              {selectedCategory === "all"
                ? "Recent Creations"
                : `Recent Creations: ${getCanonicalCategoryName(selectedCategory) || selectedCategory}`}
            </h2>
            <p className="text-xs text-[#3B241C]/70 font-sans mt-0.5">
              Showing {filteredProducts.length} of {totalProducts} {totalProducts === 1 ? "creation" : "creations"}
            </p>
          </div>
          <Link
            href="/admin/products"
            className="text-xs uppercase tracking-[0.15em] font-medium text-[#8B454B] hover:text-[#541B1B] transition-colors font-sans"
          >
            Manage Catalog
          </Link>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-[#3B241C]/70 font-light text-xs font-sans">
            No creations found in this category.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFF9F2] border-b border-[#D9C4B0] text-[10px] uppercase tracking-[0.15em] text-[#8B454B] font-medium font-sans">
                    <th className="py-3.5 px-6">Product</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9C4B0] text-xs font-sans text-[#3B241C]">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[#F8EEE2]/60 transition-colors">
                      {/* Image & Title */}
                      <td className="py-3.5 px-6 flex items-center gap-4">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#D9C4B0] bg-[#FFF9F2] shrink-0">
                          <Image
                            src={product.image_url}
                            alt={product.name || product.title || "Product creation"}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        </div>
                        <span className="font-serif font-medium text-sm text-[#541B1B] hover:text-[#722F37] transition-colors">
                          <Link href={`/admin/products`}>{product.name || product.title}</Link>
                        </span>
                      </td>
                      {/* Category */}
                      <td className="py-3.5 px-6">
                        <span className="capitalize text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#EBCDB8]/40 text-[#541B1B]">
                          {getCanonicalCategoryName(product.category) || product.category}
                        </span>
                      </td>
                      {/* Price */}
                      <td className="py-3.5 px-6 font-medium text-[#541B1B] text-sm">
                        ₹{product.price.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-[#D9C4B0]">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 flex gap-4 hover:bg-[#F8EEE2]/60 transition-colors items-center font-sans">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#D9C4B0] bg-[#FFF9F2] shrink-0">
                    <Image
                      src={product.image_url}
                      alt={product.name || product.title || "Product creation"}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-grow min-w-0 space-y-1">
                    <span className="font-serif font-medium block truncate text-sm text-[#541B1B]">
                      <Link href="/admin/products">{product.name || product.title}</Link>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="capitalize text-[9px] font-medium px-2 py-0.5 rounded-full bg-[#EBCDB8]/40 text-[#541B1B]">
                        {getCanonicalCategoryName(product.category) || product.category}
                      </span>
                    </div>
                    <div className="font-medium text-[#541B1B] text-xs">
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
