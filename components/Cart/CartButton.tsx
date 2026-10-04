"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface CartButtonProps {
  className?: string;
}

export default function CartButton({ className = "" }: CartButtonProps) {
  const { cartCount, isLoaded } = useCart();

  return (
    <Link
      href="/cart"
      className={`relative p-2 text-[#25382E] hover:text-[#EC8D99] transition-colors duration-200 flex items-center justify-center cursor-pointer ${className}`}
      aria-label="View Shopping Cart"
    >
      <ShoppingBag size={21} className="md:w-[22px] md:h-[22px]" />
      {isLoaded && cartCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] bg-[#25382E] text-[#FFFAF1] text-[9px] font-semibold rounded-full flex items-center justify-center px-1 font-sans border border-[#FFFAF1] shadow-2xs">
          {cartCount}
        </span>
      )}
    </Link>
  );
}
