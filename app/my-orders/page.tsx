"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Loader2 } from "lucide-react";

interface CustomerOrder {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  total: number;
  subtotal: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  items: Array<{ product: { title: string }; quantity: number }>;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetch("/api/customer/orders");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load orders.");
        }

        setOrders(data.orders ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "delivered" || s === "paid") {
      return "bg-[#405F4C]/15 text-[#405F4C] border-[#405F4C]/30";
    }
    if (s === "shipped") {
      return "bg-[#F5C842]/20 text-[#25382E] border-[#F5C842]/40";
    }
    if (s === "processing") {
      return "bg-[#405F4C]/15 text-[#405F4C] border-[#405F4C]/30";
    }
    if (s === "pending") {
      return "bg-[#F5C842]/20 text-[#25382E] border-[#F5C842]/40";
    }
    return "bg-[#EC8D99]/20 text-[#25382E] border-[#EC8D99]/40";
  };

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8F2E7] min-h-screen text-[#25382E]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 space-y-8">
        <div className="space-y-2">
          <Link href="/profile" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#5C745F] hover:text-[#25382E] transition-colors font-sans">
            <ArrowLeft size={12} />
            Back to Profile
          </Link>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#EC8D99] font-sans">Artisan Archive</span>
            <h1 className="font-serif text-4xl sm:text-5xl tracking-tight text-[#25382E] font-light">My Orders</h1>
          </div>
          <p className="text-sm sm:text-base text-[#5C745F] max-w-2xl font-sans font-light leading-relaxed">
            Every bespoke and ready-to-dispatch order tied to your patron account.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[#5C745F]">
            <Loader2 size={24} className="animate-spin text-[#EC8D99]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#EC8D99]/40 bg-[#EC8D99]/10 p-6 text-xs text-[#25382E] font-sans">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-[#E5DACB] bg-[#FFFAF1] p-8 sm:p-12 text-center shadow-[0_2px_12px_rgba(37,56,46,0.03)] space-y-4 max-w-lg mx-auto font-sans">
            <Package size={28} className="mx-auto text-[#F5C842]" />
            <h2 className="font-serif text-2xl text-[#25382E] font-normal">No Orders Yet</h2>
            <p className="text-xs text-[#5C745F] font-light leading-relaxed">
              When you place an order while signed into your account, your hand-stitched pieces will appear here.
            </p>
            <div className="pt-2">
              <Link href="/" className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] text-xs uppercase tracking-[0.2em] font-medium transition-all shadow-sm hover:shadow-md">
                Browse Collection
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article key={order.id} className="bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl shadow-[0_2px_12px_rgba(37,56,46,0.03)] p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-[#E5DACB] pb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#5C745F] font-sans">Order Number</p>
                    <h2 className="font-serif text-2xl text-[#25382E] font-normal">{order.order_number}</h2>
                    <p className="text-xs text-[#5C745F] font-sans font-light">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.15em] font-medium font-sans">
                    <span className={`px-3 py-1 rounded-full border ${getStatusBadge(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                    <span className={`px-3 py-1 rounded-full border ${getStatusBadge(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 text-xs text-[#5C745F] font-sans">
                  <div className="rounded-xl border border-[#E5DACB] bg-[#FFFAF1] p-4 space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#5C745F]/60">Customer</p>
                    <p className="font-medium text-[#25382E]">{order.customer_name}</p>
                    <p className="truncate">{order.email}</p>
                  </div>
                  <div className="rounded-xl border border-[#E5DACB] bg-[#FFFAF1] p-4 space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#5C745F]/60">Contact</p>
                    <p className="font-medium text-[#25382E]">{order.phone}</p>
                  </div>
                  <div className="rounded-xl border border-[#E5DACB] bg-[#FFFAF1] p-4 space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#5C745F]/60">Total Amount</p>
                    <p className="font-serif text-lg text-[#25382E] font-medium">₹{order.total.toLocaleString("en-IN")}</p>
                    <p className="text-[11px] text-[#5C745F]/70">Subtotal: ₹{order.subtotal.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="space-y-2.5 font-sans">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#5C745F] font-medium">Items</p>
                  <div className="divide-y divide-[#E5DACB] rounded-xl border border-[#E5DACB] overflow-hidden bg-[#FFFAF1]">
                    {(order.items || []).map((item, index) => (
                      <div key={`${order.id}-${index}`} className="flex items-center justify-between gap-4 px-4 py-3 bg-[#FFFAF1]">
                        <span className="text-xs font-medium text-[#25382E]">{item.product?.title ?? "Item"}</span>
                        <span className="text-[11px] uppercase tracking-wider text-[#5C745F]">Qty {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
