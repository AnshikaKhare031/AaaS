import React from "react";
import { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center bg-[#FFFAF1] border border-[#E5DACB] rounded-3xl p-8 max-w-lg mx-auto space-y-4 font-sans">
        <div className="w-12 h-12 rounded-full bg-[#F6C4C2]/30 text-[#F5C842] flex items-center justify-center mx-auto">
          <Sparkles size={20} />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-2xl text-[#25382E]">Collection Currently In The Atelier</h3>
          <p className="text-xs text-[#5C745F] font-light leading-relaxed">
            Our artisan is currently crafting new pieces for this collection. Please check back shortly or request a custom order.
          </p>
        </div>
        <Link
          href="/custom-order"
          className="inline-block px-6 py-2.5 rounded-full bg-[#25382E] text-[#FFFAF1] text-xs uppercase tracking-[0.16em] font-medium hover:bg-[#405F4C] transition-colors"
        >
          Request Custom Piece
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
