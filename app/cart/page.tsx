"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import CartItem from "@/components/Cart/CartItem";
import CartSummary from "@/components/Cart/CartSummary";

export default function CartPage() {
  const { cart, isLoaded, cartCount } = useCart();

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-24 bg-[#F8F2E7]">
        <div className="animate-pulse space-y-4 text-center font-sans">
          <div className="w-12 h-12 rounded-full bg-[#F6C4C2]/50 mx-auto" />
          <div className="h-3 w-32 bg-[#E5DACB] rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8F2E7] min-h-[82vh] flex items-center">
        <div className="max-w-md mx-auto px-4 text-center space-y-6 font-sans">
          <div className="w-20 h-20 bg-[#FFFAF1] border border-[#E5DACB] rounded-full flex items-center justify-center mx-auto shadow-2xs">
            <ShoppingBag size={28} className="text-[#25382E]" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-[#25382E] font-light">
              Your cart is waiting for something handmade.
            </h1>
            <p className="text-[#5C745F] text-xs sm:text-sm font-light leading-relaxed">
              Explore our boutique collections of handcrafted crochet pieces, embroidered pouches, and artisan plaques.
            </p>
          </div>
          <div className="pt-2 space-y-4">
            <Link
              href="/#categories"
              className="w-full block text-center py-4 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] font-medium uppercase tracking-[0.2em] text-xs transition-colors duration-200 shadow-xs cursor-pointer"
            >
              Explore Collections
            </Link>
            <div className="grid grid-cols-2 gap-2.5 text-[10px] uppercase tracking-[0.18em] font-medium pt-1">
              <Link
                href="/crochet"
                className="p-3 bg-[#FFFAF1] border border-[#E5DACB] hover:border-[#EC8D99] text-[#25382E] transition-colors text-center cursor-pointer"
              >
                Crochet
              </Link>
              <Link
                href="/pouches"
                className="p-3 bg-[#FFFAF1] border border-[#E5DACB] hover:border-[#EC8D99] text-[#25382E] transition-colors text-center cursor-pointer"
              >
                Pouches
              </Link>
              <Link
                href="/mdf"
                className="p-3 bg-[#FFFAF1] border border-[#E5DACB] hover:border-[#EC8D99] text-[#25382E] transition-colors text-center cursor-pointer"
              >
                MDF Arts
              </Link>
              <Link
                href="/magnets"
                className="p-3 bg-[#FFFAF1] border border-[#E5DACB] hover:border-[#EC8D99] text-[#25382E] transition-colors text-center cursor-pointer"
              >
                Magnets
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8F2E7] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#E5DACB]/70 pb-6 mb-8 md:mb-12">
          <div className="space-y-1.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#5C745F] hover:text-[#25382E] font-medium mb-2 transition-colors duration-200 group cursor-pointer font-sans"
            >
              <ArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Continue Shopping</span>
            </Link>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight text-[#25382E] font-light">
              Shopping Bag
            </h1>
          </div>
          <p className="text-xs uppercase tracking-wider text-[#5C745F] font-sans mt-2 md:mt-0">
            {cartCount} {cartCount === 1 ? "artisan piece" : "artisan pieces"}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Cart items list */}
          <div className="lg:col-span-8 bg-[#FFFAF1] border border-[#E5DACB] p-6 md:p-8 space-y-2 shadow-xs">
            <div className="divide-y divide-[#E5DACB]/60">
              {cart.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4 sticky top-28">
            <CartSummary />
          </div>
        </div>
      </div>
    </section>
  );
}
