"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Order } from "@/types/order";
import { 
  Search, 
  Calendar, 
  PhoneCall, 
  AlertCircle, 
  Check,
  ClipboardList
} from "lucide-react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { SHIPPING_FREE_THRESHOLD, SHIPPING_FLAT_CHARGE } from "@/lib/shipping";

export default function TrackOrderPage() {
  const { user, isLoading } = useCustomerAuth();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  
  const shippingPaid = order ? order.total - order.subtotal : 0;

  // Form submission handler
  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim() === "" || email.trim() === "") {
      setErrorMsg("Please enter both Order Number and Email Address.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Order not found.");
      }

      setOrder(data.order);
    } catch (err) {
      console.error("Tracking lookup error:", err);
      setErrorMsg("We couldn't find an order matching those details. Please check and try again.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Reset tracking state to perform a new search
  const handleTrackAnother = () => {
    setOrder(null);
    setOrderNumber("");
    setEmail("");
    setErrorMsg(null);
  };

  // Formatting helper for Date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Timeline Step Helper
  const getTimelineSteps = (ord: Order) => {
    const isPaid = ord.payment_status === "paid";
    const status = ord.order_status;

    return [
      {
        title: "Order Confirmed",
        description: "Order registered in our system",
        isCompleted: true, // Always true since they have a valid order
        isActive: status === "pending" && !isPaid,
      },
      {
        title: "Payment Received",
        description: "Transaction verified successfully",
        isCompleted: isPaid,
        isActive: status === "pending" && isPaid,
      },
      {
        title: "Processing",
        description: "Our artists are preparing your handmade creations",
        isCompleted: ["processing", "shipped", "delivered"].includes(status),
        isActive: status === "processing",
      },
      {
        title: "Shipped",
        description: "Package is in transit with our logistics partner",
        isCompleted: ["shipped", "delivered"].includes(status),
        isActive: status === "shipped",
      },
      {
        title: "Delivered",
        description: "Handed over to recipient successfully",
        isCompleted: status === "delivered",
        isActive: status === "delivered",
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 bg-background animate-pulse">
        <div className="w-12 h-12 rounded-full bg-border-custom/50 mx-auto" />
        <div className="h-4 w-32 bg-border-custom/50 rounded mx-auto mt-4" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F2E7] pt-28 pb-16 font-sans text-[#25382E] flex items-center justify-center">
        <div className="max-w-md mx-auto bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] p-8 text-center shadow-[0_2px_12px_rgba(37,56,46,0.03)] space-y-6 font-sans">
          <div className="w-16 h-16 rounded-full bg-[#F6C4C2]/40 text-[#EC8D99] flex items-center justify-center mx-auto">
            <AlertCircle size={30} />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#EC8D99] font-sans">Patron Authentication</span>
            <h2 className="font-serif text-3xl text-[#25382E] font-light">Sign In Required</h2>
            <p className="text-[#5C745F] text-xs font-sans font-light leading-relaxed">
              Please sign into your patron account to view and follow the progress of your bespoke commission.
            </p>
          </div>
          <Link
            href="/login?next=/track-order"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] font-medium uppercase tracking-[0.2em] rounded-full text-xs transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            Sign In to Atelier Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F2E7] pt-28 pb-16 font-sans text-[#25382E]">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        
        {/* If Order is Loaded, show tracking results screen */}
        {order ? (
          <div className="space-y-8 animate-fadeIn">
            {/* Header info block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#FFFAF1] p-6 rounded-2xl border border-[#E5DACB] shadow-[0_2px_12px_rgba(37,56,46,0.03)]">
              <div className="space-y-1">
                <span className="text-[10px] text-[#5C745F] font-medium uppercase tracking-[0.2em]">Tracking Order</span>
                <h1 className="font-serif text-2xl sm:text-3xl font-light text-[#25382E]">{order.order_number}</h1>
                <p className="text-xs text-[#5C745F] font-light flex items-center gap-1.5 mt-0.5">
                  <Calendar size={13} className="text-[#EC8D99]" />
                  Ordered on {formatDate(order.created_at)}
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2">
                {order.payment_status === "paid" && (
                  <span className="inline-flex items-center text-[10px] font-medium tracking-[0.15em] uppercase px-3 py-1 rounded-full bg-[#405F4C]/15 text-[#405F4C] border border-[#405F4C]/30">
                    Paid
                  </span>
                )}
                {order.payment_status === "pending" && (
                  <span className="inline-flex items-center text-[10px] font-medium tracking-[0.15em] uppercase px-3 py-1 rounded-full bg-[#F5C842]/20 text-[#25382E] border border-[#F5C842]/40">
                    Pending
                  </span>
                )}
                {order.payment_status === "failed" && (
                  <span className="inline-flex items-center text-[10px] font-medium tracking-[0.15em] uppercase px-3 py-1 rounded-full bg-[#EC8D99]/20 text-[#25382E] border border-[#EC8D99]/40">
                    Failed
                  </span>
                )}
                <span className="inline-flex items-center text-[10px] font-medium tracking-[0.15em] uppercase px-3 py-1 rounded-full bg-[#F6C4C2]/50 text-[#25382E] border border-[#E5DACB] capitalize">
                  {order.order_status}
                </span>
              </div>
            </div>

            {/* Visual Timeline Section */}
            <div className="bg-[#FFFAF1] p-6 md:p-8 rounded-2xl border border-[#E5DACB] shadow-[0_2px_12px_rgba(37,56,46,0.03)] space-y-6">
              <h3 className="font-serif text-xl font-normal text-[#25382E] border-b border-[#E5DACB] pb-3 flex items-center gap-2">
                <ClipboardList size={18} className="text-[#EC8D99]" />
                <span>Crafting & Dispatch Timeline</span>
              </h3>

              {/* Responsive Timeline Grid */}
              <div className="relative pl-6 md:pl-0 md:grid md:grid-cols-5 gap-4">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-[16px] left-[10%] right-[10%] h-[2px] bg-[#E5DACB] -z-1" />

                {/* Connecting Line (Mobile) */}
                <div className="md:hidden absolute top-[10px] bottom-[10px] left-[7px] w-[2px] bg-[#E5DACB]" />

                {getTimelineSteps(order).map((step, index) => {
                  let bubbleClass = "bg-[#F8F2E7] text-[#5C745F]";
                  let textClass = "text-[#5C745F] font-light";
                  let titleClass = "text-[#25382E] font-normal";

                  if (step.isCompleted) {
                    bubbleClass = "bg-[#405F4C] text-[#FFFAF1] shadow-xs";
                    titleClass = "text-[#25382E] font-medium";
                  } else if (step.isActive) {
                    bubbleClass = "bg-[#25382E] text-[#FFFAF1] ring-4 ring-[#EC8D99]/30";
                    titleClass = "text-[#25382E] font-semibold";
                    textClass = "text-[#5C745F] font-medium";
                  }

                  return (
                    <div 
                      key={`step-${index}`}
                      className="relative flex md:flex-col items-start md:items-center text-left md:text-center pb-6 md:pb-0 gap-4 md:gap-3"
                    >
                      {/* Status Bubble indicator */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 z-10 transition-all ${bubbleClass}`}>
                        {step.isCompleted ? <Check size={14} /> : <span>{index + 1}</span>}
                      </div>

                      {/* Details block */}
                      <div className="space-y-0.5 mt-0.5 md:mt-0 font-sans">
                        <h4 className={`text-xs md:text-sm ${titleClass}`}>{step.title}</h4>
                        <p className={`text-[10px] md:text-xs leading-normal ${textClass}`}>{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer & Shipping Grid */}
            <div className="bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] shadow-[0_2px_12px_rgba(37,56,46,0.03)] p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#E5DACB]">
                {/* Customer block */}
                <div className="space-y-3 font-sans">
                  <h4 className="font-serif text-lg font-normal text-[#25382E]">Patron Information</h4>
                  <div className="space-y-1.5 text-xs text-[#5C745F]">
                    <p className="font-medium text-[#25382E] text-sm">{order.customer_name}</p>
                    <p>Email: {order.email}</p>
                    <p>Phone: {order.phone}</p>
                  </div>
                </div>

                {/* Shipping destination */}
                <div className="space-y-3 pt-6 md:pt-0 md:pl-8 font-sans">
                  <h4 className="font-serif text-lg font-normal text-[#25382E]">Delivery Destination</h4>
                  <div className="space-y-1.5 text-xs text-[#5C745F]">
                    <p className="font-medium text-[#25382E]">{order.house_flat}, {order.street}</p>
                    {order.landmark && <p className="text-[#5C745F]/70 italic">Landmark: {order.landmark}</p>}
                    <p>{order.city}, {order.state} - {order.pin_code}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchased Items block */}
            <div className="bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] shadow-[0_2px_12px_rgba(37,56,46,0.03)] p-6 md:p-8 space-y-6">
              <h3 className="font-serif text-xl font-normal text-[#25382E] border-b border-[#E5DACB] pb-3">
                Ordered Items
              </h3>
              <div className="divide-y divide-[#E5DACB] font-sans">
                {order.items.map((item, index) => {
                  const lineTotal = item.product.price * item.quantity;
                  return (
                    <div key={`confirm-item-${index}`} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#E5DACB] bg-[#FFFAF1] shrink-0">
                          <Image
                            src={item.product.image_url}
                            alt={item.product.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-serif text-sm font-medium text-[#25382E] line-clamp-1">{item.product.title}</h4>
                          <p className="text-[11px] text-[#5C745F] font-light">Qty: {item.quantity} × ₹{item.product.price.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-serif font-medium text-sm text-[#25382E]">₹{lineTotal.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subtotal totals Summary card */}
            <div className="bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] shadow-[0_2px_12px_rgba(37,56,46,0.03)] p-6 md:p-8 space-y-4">
              <div className="space-y-2 text-xs sm:text-sm text-[#5C745F] font-sans">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#25382E]">₹{order.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span>Delivery Charges</span>
                    <span className="text-[#25382E] font-medium">
                      {shippingPaid === 0 ? "Complimentary" : `₹${shippingPaid}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C745F]/70 italic leading-normal text-right font-light">
                    {shippingPaid === 0 
                      ? `Complimentary delivery applied (orders ₹${SHIPPING_FREE_THRESHOLD}+).`
                      : `Standard ₹${SHIPPING_FLAT_CHARGE} delivery applies to orders below ₹${SHIPPING_FREE_THRESHOLD}.`
                    }
                  </p>
                </div>
              </div>
              <div className="border-t border-[#E5DACB] pt-4 flex justify-between items-center">
                <span className="font-serif text-base text-[#25382E]">Grand Total</span>
                <span className="font-serif text-2xl font-light text-[#25382E]">₹{order.total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Help / Contact Section */}
            <div className="text-center space-y-4 p-8 bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl">
              <p className="text-xs text-[#5C745F] font-sans">Need assistance with your commission or delivery milestones?</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center font-sans">
                <button
                  onClick={handleTrackAnother}
                  className="w-full sm:w-auto px-7 py-3.5 border border-[#25382E] text-[#25382E] hover:bg-[#F8F2E7] text-xs font-medium uppercase tracking-[0.2em] rounded-full transition-all cursor-pointer"
                >
                  Track Another Order
                </button>
                <Link
                  href="/contact"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] text-xs font-medium uppercase tracking-[0.2em] rounded-full shadow-sm hover:shadow-md transition-all"
                >
                  <PhoneCall size={13} />
                  <span>Contact Atelier</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Search form interface */
          <div className="max-w-md mx-auto bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] p-6 md:p-8 shadow-[0_2px_12px_rgba(37,56,46,0.03)] space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#EC8D99] font-sans">Atelier Tracking</span>
              <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#25382E]">Track Your Order</h1>
              <p className="font-sans text-xs text-[#5C745F] font-light leading-relaxed">
                Enter your Order Number and registered Email Address to view real-time crafting status.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-[#EC8D99]/15 border border-[#EC8D99]/40 rounded-xl p-4 flex gap-2.5 text-xs text-[#25382E] leading-normal font-sans">
                <AlertCircle className="shrink-0 mt-0.5 text-[#EC8D99]" size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleTrackSubmit} className="space-y-4 font-sans text-xs">
              {/* Order Number Field */}
              <div className="space-y-1.5">
                <label htmlFor="orderNumber" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                  Order Number
                </label>
                <input
                  type="text"
                  id="orderNumber"
                  disabled={loading}
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. CM-1001"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/40 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Email Address Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. patron@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/40 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Submit Trigger */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] font-medium uppercase tracking-[0.2em] text-xs rounded-full transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-[#FFFAF1] border-t-transparent rounded-full" />
                    <span>Locating Commission...</span>
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
