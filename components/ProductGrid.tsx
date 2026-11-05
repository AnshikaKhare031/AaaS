import React from "react";
import { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import { Sparkles } from "lucide-react";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center bg-[#FFF9F2] border border-[#D9C4B0] rounded-3xl p-8 max-w-lg mx-auto space-y-4 font-sans">
        <div className="w-12 h-12 rounded-full bg-[#EBCDB8]/50 text-[#B58A58] flex items-center justify-center mx-auto">
          <Sparkles size={20} />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-2xl text-[#541B1B]">Collection Currently In The Atelier</h3>
          <p className="text-xs text-[#8B454B] font-light leading-relaxed">
            Our artisan is currently crafting new pieces for this collection. Please check back shortly.
          </p>
        </div>
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
