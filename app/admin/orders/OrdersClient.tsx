"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Order } from "@/types/order";
import { useToast } from "@/components/admin/Toast";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  ShoppingBag,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OrdersClientProps {
  initialOrders: Order[];
  errorMsg: string | null;
}

export default function OrdersClient({ initialOrders, errorMsg }: OrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { showToast } = useToast();

  // 1. Toggle expanded order details
  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  // 2. Handle order status updates
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update order status.");
      }

      // Update state
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId
            ? { ...order, order_status: newStatus as Order["order_status"], updated_at: new Date().toISOString() }
            : order
        )
      );
      showToast(`Order status updated to ${newStatus}!`, "success");
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // 3. Filter and search computations
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchText.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchText.toLowerCase()) ||
      order.email.toLowerCase().includes(searchText.toLowerCase()) ||
      order.phone.includes(searchText);

    const matchesPayment = 
      paymentFilter === "all" || 
      order.payment_status === paymentFilter;

    const matchesStatus = 
      statusFilter === "all" || 
      order.order_status === statusFilter;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  // Render error boundary block if DB couldn't be loaded
  if (errorMsg) {
    return (
      <div className="bg-[#FFFAF1] border border-[#C96A6A]/30 p-8 text-center max-w-xl mx-auto my-8 shadow-xs rounded-2xl">
        <div className="w-12 h-12 bg-[#C96A6A]/10 flex items-center justify-center mx-auto mb-4 border border-[#C96A6A]/20 rounded-full">
          <AlertCircle className="text-[#C96A6A]" size={22} />
        </div>
        <h3 className="font-serif text-2xl text-[#25382E]">Database Connection Error</h3>
        <p className="text-[#5C745F] text-xs font-sans mt-2 mb-6 leading-relaxed">
          {errorMsg}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] text-xs font-medium uppercase tracking-[0.15em] px-6 py-3 rounded-full transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Payment Status Badge Helper
  const renderPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center text-[9px] font-medium tracking-[0.15em] uppercase px-2.5 py-0.5 bg-[#405F4C]/15 text-[#405F4C] border border-[#405F4C]/30 rounded-full">
            Paid
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center text-[9px] font-medium tracking-[0.15em] uppercase px-2.5 py-0.5 bg-[#C96A6A]/15 text-[#8B3A3A] border border-[#C96A6A]/30 rounded-full">
            Failed
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center text-[9px] font-medium tracking-[0.15em] uppercase px-2.5 py-0.5 bg-[#F8F2E7] text-[#5C745F] border border-[#E5DACB] rounded-full">
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[9px] font-medium tracking-[0.15em] uppercase px-2.5 py-0.5 bg-[#F5C842]/20 text-[#25382E] border border-[#F5C842]/40 rounded-full">
            Pending
          </span>
        );
    }
  };

  // Order Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "processing":
        return (
          <span className="inline-flex items-center text-[9px] font-medium tracking-[0.15em] uppercase px-2.5 py-0.5 bg-[#EC8D99]/20 text-[#25382E] border border-[#EC8D99]/40 rounded-full">
            Processing
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center text-[9px] font-medium tracking-[0.15em] uppercase px-2.5 py-0.5 bg-[#F6C4C2]/50 text-[#25382E] border border-[#EC8D99]/30 rounded-full">
            Shipped
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center text-[9px] font-medium tracking-[0.15em] uppercase px-2.5 py-0.5 bg-[#405F4C]/15 text-[#405F4C] border border-[#405F4C]/30 rounded-full">
            Delivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[9px] font-medium tracking-[0.15em] uppercase px-2.5 py-0.5 bg-[#F5C842]/20 text-[#25382E] border border-[#F5C842]/40 rounded-full">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-[#E5DACB] pb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#EC8D99] font-medium font-sans">Fulfillment & Orders</span>
        <h1 className="font-serif text-3xl md:text-4xl text-[#25382E] mt-1">Patron Orders</h1>
        <p className="text-xs font-sans text-[#5C745F] font-light mt-1">
          Review customer acquisitions, verify Razorpay settlements, and update shipment dispatch status.
        </p>
      </div>

      {/* Filters & Search Toolbar */}
      {orders.length > 0 && (
        <div className="bg-[#FFFAF1] p-4 sm:p-5 border border-[#E5DACB] rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C745F]/60" size={16} />
            <input
              type="text"
              placeholder="Search by order #, patron name, email, phone..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E5DACB] bg-[#F8F2E7] text-xs text-[#25382E] focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] placeholder-[#5C745F]/60 transition-colors rounded-lg"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
            {/* Payment Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#5C745F] font-medium font-sans uppercase tracking-[0.15em]">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-1.5 border border-[#E5DACB] text-xs font-medium text-[#25382E] focus:outline-none focus:border-[#EC8D99] bg-[#F8F2E7] rounded-lg cursor-pointer"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Order Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#5C745F] font-medium font-sans uppercase tracking-[0.15em]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-[#E5DACB] text-xs font-medium text-[#25382E] focus:outline-none focus:border-[#EC8D99] bg-[#F8F2E7] rounded-lg cursor-pointer"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {orders.length === 0 ? (
        /* Empty State */
        <div className="bg-[#FFFAF1] border border-[#E5DACB] p-16 text-center max-w-xl mx-auto my-8 rounded-2xl">
          <div className="w-14 h-14 bg-[#F6C4C2]/30 border border-[#E5DACB] rounded-full flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="text-[#25382E]" size={24} />
          </div>
          <h3 className="font-serif text-2xl text-[#25382E]">No customer orders yet</h3>
          <p className="text-[#5C745F] text-xs font-sans font-light mt-2 leading-relaxed">
            As soon as patrons acquire pieces from the atelier, their orders will appear here.
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        /* No Search Matches */
        <div className="text-center py-16 bg-[#FFFAF1] border border-[#E5DACB] shadow-xs rounded-2xl">
          <p className="text-[#5C745F] text-xs font-sans font-light">
            No orders match the selected search criteria.
          </p>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const isUpdating = updatingOrderId === order.id;
            const formattedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div 
                key={order.id}
                className={`bg-[#FFFAF1] border transition-all duration-200 shadow-xs overflow-hidden rounded-2xl ${
                  isExpanded ? "border-[#EC8D99]" : "border-[#E5DACB] hover:border-[#5C745F]/50"
                }`}
              >
                {/* Order Summary Header Grid */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:flex items-center flex-wrap gap-x-8 gap-y-3 w-full">
                    {/* Order Number */}
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[9px] text-[#5C745F] font-medium font-sans uppercase tracking-[0.15em]">Order Ref</span>
                      <span className="font-serif text-base font-semibold text-[#25382E]">{order.order_number}</span>
                    </div>

                    {/* Customer */}
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[9px] text-[#5C745F] font-medium font-sans uppercase tracking-[0.15em]">Patron</span>
                      <span className="text-xs font-medium text-[#25382E] line-clamp-1">{order.customer_name}</span>
                    </div>

                    {/* Date */}
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[9px] text-[#5C745F] font-medium font-sans uppercase tracking-[0.15em]">Date Placed</span>
                      <span className="text-xs text-[#5C745F] font-normal flex items-center gap-1">
                        <Calendar size={11} className="text-[#EC8D99]" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Total Amount */}
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[9px] text-[#5C745F] font-medium font-sans uppercase tracking-[0.15em]">Total Amount</span>
                      <span className="text-xs font-serif font-semibold text-[#25382E]">₹{order.total.toLocaleString("en-IN")}</span>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2.5 sm:col-span-2 md:ml-auto shrink-0 pt-1 md:pt-0">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[8px] text-[#5C745F] font-medium font-sans uppercase tracking-[0.15em]">Payment</span>
                        {renderPaymentBadge(order.payment_status)}
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[8px] text-[#5C745F] font-medium font-sans uppercase tracking-[0.15em]">Dispatch</span>
                        {renderStatusBadge(order.order_status)}
                      </div>
                    </div>
                  </div>

                  {/* Expansion Indicator Arrow */}
                  <div className="self-end md:self-center shrink-0 p-1.5 bg-[#F8F2E7] text-[#5C745F] border border-[#E5DACB] rounded-lg">
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>

                {/* Expandable Order Details Panel */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-[#E5DACB] bg-[#F8F2E7]/40"
                    >
                      <div className="p-4 sm:p-6 md:p-8 space-y-6">
                        {/* Section Grid: Info blocks */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                          
                          {/* Block 1: Customer & Shipping Details */}
                          <div className="bg-[#FFFAF1] p-5 border border-[#E5DACB] rounded-xl space-y-4">
                            <h4 className="font-serif text-sm font-semibold text-[#25382E] border-b border-[#E5DACB] pb-2.5 flex items-center gap-2">
                              <MapPin size={14} className="text-[#EC8D99]" />
                              Patron & Destination
                            </h4>
                            <div className="space-y-3 text-xs text-[#5C745F] font-sans">
                              {/* Contact Details */}
                              <div className="space-y-1 bg-[#F8F2E7] p-3 border border-[#E5DACB] rounded-lg">
                                <p className="font-medium text-[#25382E]">{order.customer_name}</p>
                                <p className="flex items-center gap-1.5 mt-1">
                                  <Mail size={11} className="text-[#EC8D99]" />
                                  <a href={`mailto:${order.email}`} className="hover:text-[#25382E] underline">{order.email}</a>
                                </p>
                                <p className="flex items-center gap-1.5 mt-0.5">
                                  <Phone size={11} className="text-[#EC8D99]" />
                                  <a href={`tel:${order.phone}`} className="hover:text-[#25382E] underline">{order.phone}</a>
                                </p>
                              </div>

                              {/* Address Details */}
                              <div className="space-y-0.5 px-0.5">
                                <p className="font-medium text-[#25382E] uppercase tracking-[0.15em] text-[8px] mb-1 text-[#5C745F]">Shipping Address</p>
                                <p className="text-[#25382E] font-normal">{order.house_flat}, {order.street}</p>
                                {order.landmark && <p className="text-[#5C745F] font-light italic">Landmark: {order.landmark}</p>}
                                <p className="text-[#25382E] font-normal">{order.city}, {order.state} - {order.pin_code}</p>
                              </div>
                            </div>
                          </div>

                          {/* Block 2: Payment Details & Settings */}
                          <div className="bg-[#FFFAF1] p-5 border border-[#E5DACB] rounded-xl space-y-4">
                            <h4 className="font-serif text-sm font-semibold text-[#25382E] border-b border-[#E5DACB] pb-2.5 flex items-center gap-2">
                              <CreditCard size={14} className="text-[#EC8D99]" />
                              Payment Verification
                            </h4>
                            <div className="space-y-3.5 text-xs text-[#5C745F] font-sans">
                              <div className="flex justify-between items-center py-1">
                                <span className="font-medium text-[#5C745F]">Settlement State:</span>
                                {renderPaymentBadge(order.payment_status)}
                              </div>

                              {/* Razorpay Meta data */}
                              <div className="space-y-2 bg-[#F8F2E7] p-3 border border-[#E5DACB] rounded-lg">
                                <div className="flex flex-col space-y-0.5">
                                  <span className="text-[8px] font-medium uppercase tracking-[0.15em] text-[#5C745F]">Razorpay Payment Ref</span>
                                  <span className="font-mono text-[10px] text-[#25382E] break-all select-all">
                                    {order.razorpay_payment_id || <span className="text-[#5C745F]/60 italic">Pending verification</span>}
                                  </span>
                                </div>
                                <div className="flex flex-col space-y-0.5 pt-1.5 border-t border-[#E5DACB]">
                                  <span className="text-[8px] font-medium uppercase tracking-[0.15em] text-[#5C745F]">Razorpay Order ID</span>
                                  <span className="font-mono text-[10px] text-[#25382E] break-all select-all">
                                    {order.razorpay_order_id || <span className="text-[#5C745F]/60 italic">Pending verification</span>}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Block 3: Fulfillment & Status Change */}
                          <div className="bg-[#FFFAF1] p-5 border border-[#E5DACB] rounded-xl space-y-4">
                            <h4 className="font-serif text-sm font-semibold text-[#25382E] border-b border-[#E5DACB] pb-2.5 flex items-center gap-2">
                              Dispatch Status
                            </h4>
                            <div className="space-y-4 text-xs font-sans">
                              <div className="space-y-1.5">
                                <label className="font-medium text-[#5C745F] uppercase tracking-[0.15em] text-[9px]">Update Fulfillment State</label>
                                <div className="relative">
                                  <select
                                    disabled={isUpdating}
                                    value={order.order_status}
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                    className="w-full px-3 py-2 border border-[#E5DACB] text-xs font-medium text-[#25382E] focus:outline-none focus:border-[#EC8D99] bg-[#F8F2E7] rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                  </select>
                                  {isUpdating && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                      <Loader2 className="animate-spin text-[#F5C842]" size={14} />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="p-3 bg-[#F6C4C2]/20 border border-[#E5DACB] rounded-lg text-[10px] text-[#5C745F] leading-relaxed">
                                <strong className="font-medium block uppercase tracking-[0.15em] text-[8px] text-[#25382E] mb-0.5">Atelier Workflow</strong>
                                Status transitions notify patron tracking: Processing → Shipped → Delivered.
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Order Items Table section */}
                        <div className="space-y-3">
                          <h4 className="font-serif text-sm font-semibold text-[#25382E] flex items-center gap-2 px-1">
                            <ShoppingBag size={14} className="text-[#EC8D99]" />
                            Crafted Pieces in Order
                          </h4>

                          <div className="bg-[#FFFAF1] border border-[#E5DACB] rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#F8F2E7] border-b border-[#E5DACB] text-[9px] uppercase tracking-[0.15em] text-[#5C745F] font-medium font-sans">
                                  <th className="py-3 px-4">Creation Details</th>
                                  <th className="py-3 px-4 text-center">Quantity</th>
                                  <th className="py-3 px-4 text-right">Unit Price</th>
                                  <th className="py-3 px-4 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E5DACB]/50 font-sans text-[#25382E]">
                                {order.items.map((item, index) => {
                                  const lineTotal = item.product.price * item.quantity;
                                  return (
                                    <tr key={`${order.id}-item-${index}`} className="hover:bg-[#F8F2E7]/50 transition-colors">
                                      {/* Product Image and Details */}
                                      <td className="py-3 px-4 flex items-center gap-3">
                                        <div className="relative w-10 h-10 border border-[#E5DACB] bg-[#F8F2E7] rounded-lg shrink-0 overflow-hidden">
                                          <Image
                                            src={item.product.image_url}
                                            alt={item.product?.title || (item.product as unknown as { name?: string })?.name || "Order item"}
                                            fill
                                            className="object-cover"
                                            sizes="40px"
                                          />
                                        </div>
                                        <div className="flex flex-col space-y-0.5">
                                          <span className="font-medium text-[#25382E] line-clamp-1">{item.product.title}</span>
                                          <span className="text-[8px] text-[#5C745F] uppercase tracking-[0.15em]">{item.product.category}</span>
                                        </div>
                                      </td>
                                      
                                      {/* Qty */}
                                      <td className="py-3 px-4 text-center font-medium text-[#25382E]">
                                        {item.quantity}
                                      </td>
                                      
                                      {/* Price */}
                                      <td className="py-3 px-4 text-right font-normal text-[#5C745F]">
                                        ₹{item.product.price.toLocaleString("en-IN")}
                                      </td>
                                      
                                      {/* Line Total */}
                                      <td className="py-3 px-4 text-right font-serif font-semibold text-[#25382E]">
                                        ₹{lineTotal.toLocaleString("en-IN")}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
