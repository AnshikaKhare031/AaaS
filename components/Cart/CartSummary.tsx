"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { calculateShipping, SHIPPING_FREE_THRESHOLD, SHIPPING_FLAT_CHARGE } from "@/lib/shipping";
import { ShieldCheck, Truck } from "lucide-react";

interface CartSummaryProps {
  showCheckoutButton?: boolean;
}

export default function CartSummary({ showCheckoutButton = true }: CartSummaryProps) {
  const { cartSubtotal } = useCart();
  
  const shipping = calculateShipping(cartSubtotal);
  const total = cartSubtotal + shipping;

  return (
    <div className="bg-[#FFF9F2] border border-[#D9C4B0] p-6 md:p-8 space-y-6 shadow-xs font-sans">
      <h3 className="font-serif text-xl sm:text-2xl tracking-tight text-[#541B1B] border-b border-[#D9C4B0]/70 pb-4 font-normal">
        Order Summary
      </h3>

      <div className="space-y-4 text-xs sm:text-sm">
        <div className="flex justify-between items-center text-[#3B241C]">
          <span>Subtotal</span>
          <span className="font-medium text-[#541B1B]">
            ₹{cartSubtotal.toLocaleString("en-IN")}
          </span>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[#3B241C]">
            <span>Shipping</span>
            <span className="text-[#541B1B] font-medium">
              {shipping === 0 ? "Complimentary" : `₹${shipping}`}
            </span>
          </div>
          <p className="text-[11px] text-[#8B454B] leading-normal font-light">
            {shipping === 0 
              ? `Complimentary shipping on orders of ₹${SHIPPING_FREE_THRESHOLD} or more.`
              : `Flat ₹${SHIPPING_FLAT_CHARGE} delivery charge applies to orders below ₹${SHIPPING_FREE_THRESHOLD}.`
            }
          </p>
        </div>

        <div className="border-t border-[#D9C4B0]/70 pt-4 flex justify-between items-end">
          <span className="font-serif text-lg font-medium text-[#541B1B]">Total</span>
          <div className="text-right">
            <span className="font-serif text-2xl font-normal text-[#541B1B]">
              ₹{total.toLocaleString("en-IN")}
            </span>
            <p className="text-[10px] uppercase tracking-wider text-[#8B454B]/80 mt-0.5">All taxes included</p>
          </div>
        </div>
      </div>

      {showCheckoutButton && (
        <Link
          href="/checkout"
          className="w-full block text-center py-4 bg-[#541B1B] hover:bg-[#722F37] text-[#FFF9F2] font-medium uppercase tracking-[0.2em] text-xs transition-colors duration-200 shadow-xs cursor-pointer"
        >
          Proceed to Checkout
        </Link>
      )}

      {/* Trust guarantees */}
      <div className="pt-2 border-t border-[#D9C4B0]/50 space-y-2 text-[11px] text-[#8B454B] font-light">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#52734D]" />
          <span>Encrypted Razorpay payment</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-[#8B454B]" />
          <span>Carefully packed with handwritten note</span>
        </div>
      </div>
    </div>
  );
}
