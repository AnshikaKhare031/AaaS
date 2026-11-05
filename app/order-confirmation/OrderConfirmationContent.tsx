"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Order } from "@/types/order";
import { 
  CheckCircle2, 
  ShoppingBag, 
  AlertTriangle, 
  Mail, 
  Truck, 
  MapPin
} from "lucide-react";
import { motion } from "framer-motion";
import { SHIPPING_FREE_THRESHOLD, SHIPPING_FLAT_CHARGE } from "@/lib/shipping";

interface OrderConfirmationContentProps {
  orderNumber: string | undefined;
}

export default function OrderConfirmationContent({ orderNumber }: OrderConfirmationContentProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const shippingPaid = order ? order.total - order.subtotal : 0;

  useEffect(() => {
    if (!orderNumber) {
      setError("No order number specified.");
      setIsLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/customer/orders/detail?order=${orderNumber}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || "Order not found.");
        } else {
          setOrder(data.order);
        }
      } catch (err) {
        console.error("Error loading order details:", err);
        setError("Unable to load order details.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOrderDetails();
  }, [orderNumber]);

  // Loading skeleton matching the structure of the confirmation page
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8EEE2] pt-28 pb-16 md:pt-36 md:pb-24 font-sans text-[#3B241C]">
        <div className="max-w-4xl mx-auto px-4 space-y-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#D9C4B0] mx-auto" />
            <div className="h-8 bg-[#D9C4B0] rounded-md w-64 mx-auto" />
            <div className="h-4 bg-[#D9C4B0] rounded-md w-96 mx-auto" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Order Info & Items */}
              <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-3xl p-6 md:p-8 space-y-6">
                <div className="h-6 bg-[#D9C4B0] rounded-md w-40" />
                <div className="space-y-3">
                  <div className="h-12 bg-[#D9C4B0]/50 rounded-2xl w-full" />
                  <div className="h-12 bg-[#D9C4B0]/50 rounded-2xl w-full" />
                </div>
              </div>

              {/* Shipping & Customer */}
              <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-3xl p-6 md:p-8 space-y-6">
                <div className="h-6 bg-[#D9C4B0] rounded-md w-48" />
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="h-24 bg-[#D9C4B0]/50 rounded-2xl" />
                  <div className="h-24 bg-[#D9C4B0]/50 rounded-2xl" />
                </div>
              </div>
            </div>

            {/* Sidebar Summary Skeleton */}
            <div className="space-y-6">
              <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-3xl p-6 space-y-4">
                <div className="h-5 bg-[#D9C4B0] rounded-md w-32" />
                <div className="space-y-2">
                  <div className="h-4 bg-[#D9C4B0]/60 rounded-md w-full" />
                  <div className="h-4 bg-[#D9C4B0]/60 rounded-md w-full" />
                  <div className="h-px bg-[#D9C4B0]" />
                  <div className="h-6 bg-[#D9C4B0] rounded-md w-3/4" />
                </div>
              </div>
              <div className="h-12 bg-[#D9C4B0] rounded-xl w-full" />
              <div className="h-12 bg-[#D9C4B0] rounded-xl w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Friendly Error Page for Order Not Found/Unauthorized
  if (error || !order) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center bg-[#F8EEE2] px-4 py-24 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-3xl p-8 md:p-12 text-center max-w-md w-full shadow-xs space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#A83232] flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-[#541B1B]">We couldn&apos;t find this order.</h2>
            <p className="text-[#3B241C]/80 text-sm font-sans font-light leading-relaxed">
              The order details are unavailable. It might be due to an invalid order number, a temporary database error, or unauthorized access.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-3.5 bg-[#541B1B] hover:bg-[#722F37] text-[#FFF9F2] text-xs uppercase tracking-widest font-semibold rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            Return to Home
          </Link>
        </motion.div>
      </section>
    );
  }

  // Format creation date
  const orderDateText = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <section className="min-h-screen bg-[#F8EEE2] pt-28 pb-16 md:pt-36 md:pb-24 font-sans text-[#3B241C]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 space-y-10">
        
        {/* Success Header Area */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 10 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#52734D]/15 text-[#52734D] border border-[#52734D]/30 shadow-sm"
          >
            <CheckCircle2 size={40} className="stroke-[1.75]" />
          </motion.div>
          
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#8B454B] font-sans">Payment Verified</span>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#541B1B]"
            >
              Order Confirmed
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-[#3B241C] text-sm sm:text-base max-w-lg mx-auto font-light leading-relaxed opacity-85"
            >
              Thank you for choosing AaaS Handmade Crochet. Your piece is being thoughtfully prepared by our atelier.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="inline-flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-[#8B454B] font-sans border-t border-[#D9C4B0] pt-4 mt-2 w-full max-w-2xl mx-auto"
          >
            <span className="font-medium text-[#541B1B]">Order #{order.order_number}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9C4B0] hidden sm:inline" />
            <span className="font-medium text-[#52734D] bg-[#52734D]/10 border border-[#52734D]/30 px-3 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
              {order.payment_status === "paid" ? "Paid Successfully" : "Payment Pending"}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9C4B0] hidden sm:inline" />
            <span>Placed on {orderDateText}</span>
          </motion.div>
        </div>

        {/* Email Info Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex gap-4 p-5 rounded-2xl bg-[#FFF9F2] border border-[#D9C4B0] shadow-[0_2px_12px_rgba(84,27,27,0.03)] items-start max-w-4xl mx-auto"
        >
          <div className="p-2.5 rounded-xl bg-[#F8EEE2] text-[#541B1B] shrink-0 border border-[#D9C4B0]">
            <Mail size={16} />
          </div>
          <div className="space-y-0.5 font-sans">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#8B454B]">Dispatch Notification</p>
            <p className="text-xs sm:text-sm text-[#3B241C] leading-relaxed font-light">
              A detailed confirmation note and receipt have been dispatched to <strong>{order.email}</strong>.
            </p>
          </div>
        </motion.div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Ordered Items (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Section 3 – Ordered Items */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 md:p-8 space-y-6 shadow-[0_2px_12px_rgba(84,27,27,0.03)]"
            >
              <h3 className="font-serif text-xl font-normal text-[#541B1B] border-b border-[#D9C4B0] pb-3 flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#541B1B]" />
                <span>Selected Items</span>
              </h3>

              <div className="divide-y divide-[#D9C4B0] font-sans">
                {order.items.map((item, index) => {
                  const lineTotal = item.product.price * item.quantity;
                  return (
                    <div key={`item-${index}`} className="py-5 flex items-start sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        {item.product.image_url && (
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#D9C4B0] bg-[#FFF9F2] shrink-0">
                            <Image
                              src={item.product.image_url}
                              alt={item.product.name || item.product.title || "Product"}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 64px, 80px"
                            />
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-serif font-medium text-sm sm:text-base text-[#541B1B] truncate">{item.product.name || item.product.title}</h4>
                          <p className="text-[11px] text-[#8B454B] font-medium uppercase tracking-wider">
                            {item.product.category === "crochet"
                              ? "Handmade Crochet"
                              : item.product.category === "mdf" 
                              ? "MDF Craft" 
                              : item.product.category === "pouch" 
                              ? "Handmade Pouch" 
                              : item.product.category === "magnet" 
                              ? "Crochet Magnet" 
                              : "Handmade Rakhi"}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#3B241C]">
                            <span>Qty: {item.quantity}</span>
                            <span className="text-[#D9C4B0]">•</span>
                            <span>₹{item.product.price.toLocaleString("en-IN")} each</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-serif font-normal text-base text-[#541B1B]">₹{lineTotal.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
            
          </div>

          {/* Right Column: Address, Summary, Delivery Info (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Section 2 – Delivery Address */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 md:p-8 space-y-4 shadow-[0_2px_12px_rgba(84,27,27,0.03)] font-sans"
            >
              <h4 className="font-serif text-lg font-normal text-[#541B1B] flex items-center gap-2 border-b border-[#D9C4B0] pb-3">
                <MapPin size={16} className="text-[#541B1B]" />
                <span>Delivery Address</span>
              </h4>
              <div className="space-y-3 text-xs sm:text-sm text-[#3B241C] leading-relaxed font-light">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#8B454B] font-medium">Recipient</p>
                  <p className="font-medium text-[#541B1B] text-sm">{order.customer_name}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#8B454B] font-medium">Contact</p>
                  <p className="font-medium text-[#541B1B]">{order.phone}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#8B454B] font-medium">Destination</p>
                  <p className="font-medium text-[#541B1B]">{order.house_flat}, {order.street}</p>
                  {order.landmark && (
                    <p className="text-xs text-[#8B454B] italic mt-0.5">
                      Landmark: {order.landmark}
                    </p>
                  )}
                  <p>{order.city}, {order.state} - {order.pin_code}</p>
                </div>
              </div>
            </motion.div>

            {/* Section 4 – Order Summary */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 md:p-8 space-y-4 shadow-[0_2px_12px_rgba(84,27,27,0.03)] font-sans"
            >
              <h4 className="font-serif text-lg font-normal text-[#541B1B] border-b border-[#D9C4B0] pb-3">
                Order Summary
              </h4>
              
              <div className="space-y-3 text-xs sm:text-sm text-[#3B241C]">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#541B1B]">₹{order.subtotal.toLocaleString("en-IN")}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span>Shipping Charges</span>
                    <span className="text-[#541B1B] font-medium">
                      {shippingPaid === 0 ? "Complimentary" : `₹${shippingPaid}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8B454B] leading-normal italic font-light">
                    {shippingPaid === 0
                      ? `Complimentary delivery applied (orders ₹${SHIPPING_FREE_THRESHOLD}+).`
                      : `Standard ₹${SHIPPING_FLAT_CHARGE} delivery for orders under ₹${SHIPPING_FREE_THRESHOLD}.`
                    }
                  </p>
                </div>
                
                <div className="border-t border-[#D9C4B0] pt-3 flex justify-between items-center font-medium">
                  <span className="font-serif text-base text-[#541B1B]">Total Paid</span>
                  <span className="font-serif text-xl font-light text-[#541B1B]">₹{order.total.toLocaleString("en-IN")}</span>
                </div>
                
                <div className="border-t border-[#D9C4B0] pt-3 space-y-1.5 text-xs text-[#8B454B]">
                  <div className="flex justify-between items-center">
                    <span>Payment Gateway</span>
                    <span className="font-medium text-[#541B1B]">Razorpay (Secured)</span>
                  </div>
                  {order.razorpay_payment_id && (
                    <div className="flex justify-between items-center font-mono text-[10px]">
                      <span>Payment Ref</span>
                      <span className="text-[#8B454B]">{order.razorpay_payment_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Section 5 – Delivery Information */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 md:p-8 space-y-4 shadow-[0_2px_12px_rgba(84,27,27,0.03)] font-sans text-[#3B241C] leading-relaxed"
            >
              <h4 className="font-serif text-lg font-normal text-[#541B1B] flex items-center gap-2 border-b border-[#D9C4B0] pb-3">
                <Truck size={18} className="text-[#541B1B]" />
                <span>Delivery Information</span>
              </h4>
              <div className="space-y-2.5 text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#8B454B] font-medium">Estimated Delivery</p>
                  <p className="font-serif text-base text-[#541B1B] font-medium">10–12 Business Days</p>
                </div>
                <p className="text-[#3B241C] font-light leading-relaxed opacity-85">
                  Every item is made slowly and carefully inspected before dispatch to maintain our handmade standard.
                </p>
              </div>
            </motion.div>

          </div>

        </div>

        {/* Section 6 – Need Help? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-8 text-center space-y-6 shadow-[0_2px_12px_rgba(84,27,27,0.03)] max-w-4xl mx-auto w-full font-sans"
        >
          <div className="space-y-1">
            <h4 className="font-serif text-2xl text-[#541B1B] font-normal">Questions About Your Order?</h4>
            <p className="text-xs sm:text-sm text-[#8B454B] font-light">
              Our atelier is always on hand to assist you. Reach out via email, WhatsApp, or track status anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/contact"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#FFF9F2] border border-[#D9C4B0] hover:bg-[#F8EEE2] text-[#541B1B] text-xs uppercase tracking-[0.2em] font-medium rounded-full transition-all text-center cursor-pointer"
            >
              Contact Atelier
            </Link>
            <Link
              href="/track-order"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#FFF9F2] border border-[#D9C4B0] hover:bg-[#F8EEE2] text-[#541B1B] text-xs uppercase tracking-[0.2em] font-medium rounded-full transition-all text-center cursor-pointer"
            >
              Track Progress
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#541B1B] hover:bg-[#722F37] text-[#FFF9F2] text-xs uppercase tracking-[0.2em] font-medium rounded-full transition-all text-center shadow-sm hover:shadow-md cursor-pointer"
            >
              Continue Browsing
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
