"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { CartItem as CartItemType } from "@/context/CartContext";
import { useCart } from "@/hooks/useCart";
import QuantitySelector from "./QuantitySelector";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity } = item;

  const handleDecrease = () => {
    updateQuantity(product.id, quantity - 1);
  };

  const handleIncrease = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const lineTotal = product.price * quantity;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 py-5 border-b border-[#E5DACB]/60 last:border-b-0">
      {/* Product Image */}
      <div className="relative aspect-[3/4] w-24 sm:w-20 md:w-24 overflow-hidden border border-[#E5DACB] bg-[#FFFAF1] shrink-0">
        <Image
          src={product.image_url}
          alt={product.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 96px, (max-width: 768px) 80px, 96px"
        />
      </div>

      {/* Product Info & Controls */}
      <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full text-center sm:text-left">
        <div className="space-y-1">
          <Link
            href={`/product/${product.id}`}
            className="font-serif text-base sm:text-lg font-medium text-[#25382E] hover:text-[#EC8D99] transition-colors line-clamp-2 leading-tight block"
          >
            {product.title}
          </Link>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#5C745F] font-sans">
            <span>₹{product.price.toLocaleString("en-IN")}</span>
            <span>•</span>
            <span className="text-[#25382E] bg-[#F6C4C2]/50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium">
              {product.category === "crochet"
                ? "Crochet"
                : product.category === "pouch"
                ? "Pouch"
                : product.category === "mdf"
                ? "MDF Art"
                : product.category === "rakhis"
                ? "Rakhi"
                : "Magnet"}
            </span>
          </div>
        </div>

        {/* Quantity and Subtotal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-4 sm:gap-6 md:gap-10">
          <QuantitySelector
            quantity={quantity}
            onDecrease={handleDecrease}
            onIncrease={handleIncrease}
          />

          <div className="flex items-center gap-4 sm:min-w-[110px] justify-center sm:justify-end">
            <span className="font-serif text-base sm:text-lg font-semibold text-[#25382E]">
              ₹{lineTotal.toLocaleString("en-IN")}
            </span>
            <button
              onClick={() => removeFromCart(product.id)}
              className="p-2 text-[#5C745F] hover:text-[#EC8D99] hover:bg-[#F6C4C2]/30 rounded-lg transition-colors duration-200 cursor-pointer"
              aria-label={`Remove ${product.title} from cart`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
