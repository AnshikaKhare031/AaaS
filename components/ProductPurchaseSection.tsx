"use client";

import React, { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { Product } from "@/types/product";
import { ShoppingBag, Check, MessageCircle } from "lucide-react";
import QuantitySelector from "./Cart/QuantitySelector";
import { getProductWhatsAppLink } from "@/lib/contact";

interface ProductPurchaseSectionProps {
  product: Product;
}

export default function ProductPurchaseSection({ product }: ProductPurchaseSectionProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = () => {
    if (isAdding || isAdded) return;
    setIsAdding(true);
    setTimeout(() => {
      addToCart(product, quantity);
      setIsAdding(false);
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    }, 350);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Quantity Selector and Add to Cart Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3.5 sm:gap-4">
        {/* Quantity control */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#5C745F] font-medium">
            Quantity
          </span>
          <QuantitySelector
            quantity={quantity}
            onDecrease={handleDecrease}
            onIncrease={handleIncrease}
          />
        </div>

        {/* Add to Cart Primary Button */}
        <div className="flex-grow">
          <button
            onClick={handleAddToCart}
            disabled={isAdding || isAdded}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 md:py-4 rounded-full font-medium uppercase tracking-[0.16em] text-xs transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer ${
              isAdded
                ? "bg-[#405F4C] text-[#FFFAF1]"
                : "bg-[#25382E] text-[#FFFAF1] hover:bg-[#405F4C] hover:-translate-y-0.5 active:translate-y-0"
            } ${isAdding ? "opacity-80 cursor-not-allowed" : ""}`}
          >
            {isAdding ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#FFFAF1]/30 border-t-[#FFFAF1] rounded-full animate-spin shrink-0" />
                <span>Adding to Bag...</span>
              </>
            ) : isAdded ? (
              <>
                <Check size={16} />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag size={15} />
                <span>Add to Bag</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Ask on WhatsApp Secondary Button */}
      <a
        href={getProductWhatsAppLink(product.title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ask about "${product.title}" on WhatsApp`}
        className="w-full group flex items-center justify-center gap-2.5 py-3.5 md:py-4 rounded-full border border-[#25382E] text-[#25382E] hover:bg-[#25382E] hover:text-[#FFFAF1] font-medium uppercase tracking-[0.16em] text-xs transition-all duration-300 shadow-none cursor-pointer text-center bg-transparent active:translate-y-0"
      >
        <MessageCircle size={15} className="text-[#5C745F] group-hover:text-[#FFFAF1] transition-colors" />
        <span>Ask Artisan on WhatsApp</span>
      </a>
    </div>
  );
}
