"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Product } from "@/types/product";
import { ArrowUpRight } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const productName = product.name || product.title || "Handcrafted Creation";
  const productHref = `/product/${product.id}`;

  return (
    <Link
      href={productHref}
      className="group block focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EC8D99] rounded-2xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] overflow-hidden shadow-none hover:border-[#EC8D99] hover:shadow-[0_8px_24px_rgba(37,56,46,0.06)] transition-all duration-300 cursor-pointer h-full"
      >
        {/* Product Image Frame */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F8F2E7]">
          <Image
            src={product.image_url}
            alt={productName}
            fill
            onLoad={() => setImgLoaded(true)}
            className={`object-cover transition-transform duration-700 ease-out group-hover:scale-104 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Subtle Hover Indicator */}
          <div className="absolute top-2.5 right-2.5 md:top-3 md:right-3 w-7 h-7 rounded-full bg-[#FFFAF1]/90 border border-[#E5DACB] text-[#25382E] hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-2xs">
            <ArrowUpRight size={13} className="text-[#25382E]" />
          </div>
        </div>

        {/* Product Meta Details */}
        <div className="p-3.5 sm:p-5 flex flex-col flex-grow justify-between space-y-3 font-sans">
          <div className="space-y-1.5">
            {/* Category */}
            <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#5C745F]">
              <span className="font-medium truncate">
                {product.category || "Handmade"}
              </span>
            </div>

            {/* Product Title */}
            <h3 className="font-serif text-base sm:text-lg tracking-tight text-[#25382E] transition-colors duration-200 line-clamp-1 font-medium">
              {productName}
            </h3>
          </div>

          {/* Pricing & CTA */}
          <div className="pt-2 border-t border-[#E5DACB]/50 flex items-center justify-between">
            <span className="font-serif text-base sm:text-lg font-semibold text-[#25382E]">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#5C745F] group-hover:text-[#EC8D99] transition-colors duration-200">
              Details &rarr;
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
