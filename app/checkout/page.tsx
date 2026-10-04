"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, AlertCircle, Check, Plus, MessageCircle } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { calculateShipping, SHIPPING_FREE_THRESHOLD, SHIPPING_FLAT_CHARGE } from "@/lib/shipping";
import { getWhatsAppLink } from "@/lib/contact";

interface CheckoutFormData {
  fullName: string;
  email: string;
  phone: string;
  houseFlat: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  landmark: string;
}

interface Address {
  id: string;
  full_name: string;
  phone: string;
  house_flat: string;
  street: string;
  landmark?: string | null;
  city: string;
  state: string;
  pin_code: string;
  is_default: boolean;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayWindow extends Window {
  Razorpay?: new (options: Record<string, unknown>) => {
    open: () => void;
    on: (
      event: string,
      callback: (response: {
        error: {
          code?: string;
          description?: string;
          source?: string;
          step?: string;
          reason?: string;
          metadata?: Record<string, unknown>;
        };
      }) => void
    ) => void;
  };
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as unknown as RazorpayWindow).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function CheckoutContent() {
  const router = useRouter();
  const { cart, isLoaded, cartSubtotal, clearCart } = useCart();
  const shipping = calculateShipping(cartSubtotal);
  const total = cartSubtotal + shipping;
  const { user, profile } = useCustomerAuth();

  // Saved addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Address entry state controls
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [saveForFuture, setSaveForFuture] = useState(true);

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    email: "",
    phone: "",
    houseFlat: "",
    street: "",
    city: "",
    state: "",
    pinCode: "",
    landmark: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [createdOrder, setCreatedOrder] = useState<{ id: string; number: string } | null>(null);
  const [activeOrder, setActiveOrder] = useState<{ id: string; number: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load addresses
  const loadAddresses = useCallback(async () => {
    setIsAddressesLoading(true);
    try {
      const res = await fetch("/api/customer/addresses");
      const data = await res.json();
      if (data.success && data.addresses && data.addresses.length > 0) {
        setAddresses(data.addresses);
        // Find default or first address
        const defaultAddr = data.addresses.find((a: Address) => a.is_default) || data.addresses[0];
        setSelectedAddressId(defaultAddr.id);
        setFormData({
          fullName: defaultAddr.full_name,
          email: user?.email || "",
          phone: defaultAddr.phone,
          houseFlat: defaultAddr.house_flat,
          street: defaultAddr.street,
          landmark: defaultAddr.landmark || "",
          city: defaultAddr.city,
          state: defaultAddr.state,
          pinCode: defaultAddr.pin_code,
        });
        setIsAddingNewAddress(false);
        setEditingAddressId(null);
      } else {
        setAddresses([]);
        setIsAddingNewAddress(true);
        setEditingAddressId(null);
      }
    } catch (err) {
      console.error("Failed to load saved addresses:", err);
      setIsAddingNewAddress(true);
    } finally {
      setIsAddressesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user, loadAddresses]);

  // Autofill name and email when adding new address
  useEffect(() => {
    if (user && isAddingNewAddress && !editingAddressId) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || profile?.full_name || "",
        email: user?.email || "",
      }));
    }
  }, [user, profile, isAddingNewAddress, editingAddressId]);

  // Redirect to cart if empty
  useEffect(() => {
    if (isLoaded && cart.length === 0 && !createdOrder) {
      router.push("/cart");
    }
  }, [isLoaded, cart, router, createdOrder]);

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setEditingAddressId(null);
    setIsAddingNewAddress(false);
    setFormData({
      fullName: addr.full_name,
      email: user?.email || "",
      phone: addr.phone,
      houseFlat: addr.house_flat,
      street: addr.street,
      landmark: addr.landmark || "",
      city: addr.city,
      state: addr.state,
      pinCode: addr.pin_code,
    });
    setTouched({});
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setIsAddingNewAddress(false);
    setFormData({
      fullName: addr.full_name,
      email: user?.email || "",
      phone: addr.phone,
      houseFlat: addr.house_flat,
      street: addr.street,
      landmark: addr.landmark || "",
      city: addr.city,
      state: addr.state,
      pinCode: addr.pin_code,
    });
    setTouched({});
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Validators
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const indianPhoneRegex = /^[6-9]\d{9}$/;
  const pinCodeRegex = /^[1-9]\d{5}$/;

  const isEmailValid = emailRegex.test(formData.email);
  const cleanPhone = formData.phone.replace(/[\s-]/g, "").replace(/^\+91/, "").replace(/^0/, "");
  const isPhoneValid = indianPhoneRegex.test(cleanPhone);
  const isPinValid = pinCodeRegex.test(formData.pinCode.trim());

  const errors = {
    fullName: formData.fullName.trim() === "" ? "Full Name is required" : "",
    email: !formData.email
      ? "Email is required"
      : !isEmailValid
      ? "Please enter a valid email address"
      : "",
    phone: !formData.phone
      ? "Phone number is required"
      : !isPhoneValid
      ? "Please enter a valid 10-digit Indian phone number"
      : "",
    houseFlat: formData.houseFlat.trim() === "" ? "House/Flat detail is required" : "",
    street: formData.street.trim() === "" ? "Street/Locality is required" : "",
    city: formData.city.trim() === "" ? "City is required" : "",
    state: formData.state.trim() === "" ? "State is required" : "",
    pinCode: !formData.pinCode
      ? "PIN Code is required"
      : !isPinValid
      ? "PIN Code must be a valid 6-digit Indian PIN"
      : "",
  };

  const hasErrors = Object.values(errors).some((error) => error !== "");
  const isFormValid =
    formData.fullName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.houseFlat.trim() !== "" &&
    formData.street.trim() !== "" &&
    formData.city.trim() !== "" &&
    formData.state.trim() !== "" &&
    formData.pinCode.trim() !== "" &&
    !hasErrors;

  const handleProceedPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid) {
      // Mark all required fields as touched
      const allTouched: Record<string, boolean> = {
        fullName: true,
        email: true,
        phone: true,
        houseFlat: true,
        street: true,
        city: true,
        state: true,
        pinCode: true,
      };
      setTouched(allTouched);

      // Focus on the first invalid field
      const fieldOrder = [
        "fullName",
        "email",
        "phone",
        "houseFlat",
        "street",
        "city",
        "state",
        "pinCode",
      ];
      const firstInvalidField = fieldOrder.find((field) => errors[field as keyof typeof errors] !== "");
      if (firstInvalidField) {
        const element = document.getElementById(firstInvalidField);
        if (element) {
          element.focus();
        }
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. If form is active, save address in background first
      if (isAddingNewAddress || editingAddressId) {
        try {
          const payload = {
            id: editingAddressId || undefined,
            fullName: formData.fullName.trim(),
            phone: formData.phone.trim(),
            houseFlat: formData.houseFlat.trim(),
            street: formData.street.trim(),
            landmark: formData.landmark ? formData.landmark.trim() : undefined,
            city: formData.city.trim(),
            state: formData.state.trim(),
            pinCode: formData.pinCode.trim(),
            isDefault: addresses.length === 0,
          };

          const method = editingAddressId ? "PATCH" : "POST";
          if (editingAddressId || saveForFuture) {
            const res = await fetch("/api/customer/addresses", {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
              console.error("Background address save failed:", data.error);
            }
          }
        } catch (addrErr) {
          console.error("Error saving address details in background:", addrErr);
        }
      }

      // 2. Load Razorpay Checkout Script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay Checkout SDK. Please verify your internet connection.");
      }

      let orderId = activeOrder?.id;
      let orderNumber = activeOrder?.number;

      if (!orderId || !orderNumber) {
        // 3. Create the internal order in Supabase
        const orderResponse = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: {
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
            },
            address: {
              houseFlat: formData.houseFlat,
              street: formData.street,
              landmark: formData.landmark || undefined,
              city: formData.city,
              state: formData.state,
              pinCode: formData.pinCode,
            },
            items: cart,
            subtotal: cartSubtotal,
            total: total,
          }),
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok || !orderData.success) {
          throw new Error(orderData.error || "Failed to create internal order.");
        }

        orderId = orderData.orderId;
        orderNumber = orderData.orderNumber;
        setActiveOrder({ id: orderId!, number: orderNumber! });
      } else {
        // We have an active order. Let's update its database status back to 'pending'
        const patchResponse = await fetch("/api/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderId,
            payment_status: "pending",
            customer: {
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
            },
            address: {
              houseFlat: formData.houseFlat,
              street: formData.street,
              landmark: formData.landmark || undefined,
              city: formData.city,
              state: formData.state,
              pinCode: formData.pinCode,
            },
          }),
        });
        const patchData = await patchResponse.json();
        if (!patchResponse.ok || !patchData.success) {
          throw new Error(patchData.error || "Failed to initialize payment retry.");
        }
      }

      if (!orderId || !orderNumber) {
        throw new Error("Failed to initialize order details.");
      }

      // 4. Create the payment order on Razorpay
      const paymentResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total,
          orderId: orderNumber, // Send friendly internal order number
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok || !paymentData.success) {
        throw new Error(paymentData.error || "Failed to initialize payment gateway order.");
      }

      const { razorpayOrderId, key, amountInPaise, currency } = paymentData;

      // 5. Load Razorpay Checkout Popup
      const options: Record<string, unknown> = {
        key: key,
        amount: amountInPaise,
        currency: currency,
        name: "AaaS",
        description: "Premium Handmade Crochet Order",
        order_id: razorpayOrderId,
        handler: async function (response: RazorpaySuccessResponse) {
          console.log("Razorpay payment success response:", response);
          
          setIsSubmitting(true);
          setSubmitError(null);
          
          try {
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId: orderId, // Internal UUID
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            // Clear the local cart
            clearCart();

            // Set state and redirect to the confirmation page
            setCreatedOrder({
              id: orderId!,
              number: orderNumber!,
            });
            router.push(`/order-confirmation?order=${orderNumber}`);
          } catch (err) {
            console.error("Payment verification failure:", err);
            setSubmitError(
              "Your payment could not be verified automatically.\n\n" +
              "If the amount has been deducted, please contact our support team with your Order Number and Payment ID so we can assist you."
            );
          } finally {
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#25382E", // Deep Green
        },
        modal: {
          ondismiss: async function () {
            console.log("Razorpay payment checkout window closed by user.");
            setIsSubmitting(false);
            setSubmitError("Payment was cancelled. Your order has not been completed.");
            
            // Mark order as failed in database
            if (orderId) {
              try {
                await fetch("/api/orders", {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    orderId: orderId,
                    payment_status: "failed",
                  }),
                });
              } catch (err) {
                console.error("Failed to update status on dismiss:", err);
              }
            }
          }
        }
      };

      const rzp = new (window as unknown as RazorpayWindow).Razorpay!(options);
      
      rzp.on("payment.failed", async function (response: {
        error: {
          code?: string;
          description?: string;
          source?: string;
          step?: string;
          reason?: string;
          metadata?: Record<string, unknown>;
        };
      }) {
        console.error("Razorpay payment failure response:", response.error);
        setIsSubmitting(false);
        setSubmitError(
          `Payment Failed: ${response.error.description || "The payment could not be processed."} (Error Code: ${response.error.code || "unknown"})`
        );
        
        // Mark order as failed in database
        if (orderId) {
          try {
            await fetch("/api/orders", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId: orderId,
                payment_status: "failed",
              }),
            });
          } catch (err) {
            console.error("Failed to update status on payment failure:", err);
          }
        }
      });

      rzp.open();

    } catch (err) {
      console.error("Order payment process error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };



  if (!isLoaded || cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-24 bg-background">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-border-custom/50 mx-auto" />
          <div className="h-4 w-32 bg-border-custom/50 rounded mx-auto" />
        </div>
      </div>
    );
  }

  const isFormActive = isAddingNewAddress || editingAddressId || addresses.length === 0;

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8F2E7] min-h-screen text-[#25382E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Header */}
        <div className="border-b border-[#E5DACB]/70 pb-6 mb-8 md:mb-12">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#5C745F] hover:text-[#25382E] font-medium mb-2 transition-colors duration-200 group cursor-pointer font-sans"
          >
            <ArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Bag</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight text-[#25382E] font-light">
            Checkout Details
          </h1>
        </div>

        {/* Content Columns */}
        <form onSubmit={handleProceedPayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column - Shipping & Customer Info */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Customer Information Block */}
            <div className="bg-[#FFFAF1] border border-[#E5DACB] p-6 md:p-8 space-y-6 shadow-xs">
              <h2 className="font-serif text-xl md:text-2xl text-[#25382E] font-normal border-b border-[#E5DACB]/60 pb-3">
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
                {/* Full Name */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="fullName" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                    Full Name <span className="text-[#C96A6A]">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter your full name"
                    disabled={!isFormActive}
                    className={`w-full px-4 py-3 border bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] transition-colors disabled:opacity-75 ${
                      touched.fullName && errors.fullName
                        ? "border-[#C96A6A]"
                        : "border-[#E5DACB]"
                    }`}
                  />
                  {touched.fullName && errors.fullName && (
                    <p className="text-[11px] text-[#C96A6A] flex items-center gap-1 font-sans">
                      <AlertCircle size={12} /> {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email (Always Read-only & prefilled) */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="email" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-4 py-3 border border-[#E5DACB] bg-[#F6C4C2]/20 text-sm text-[#5C745F] focus:outline-none cursor-not-allowed font-sans"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="phone" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                    Phone Number <span className="text-[#C96A6A]">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="10-digit mobile number"
                    disabled={!isFormActive}
                    className={`w-full px-4 py-3 border bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] transition-colors disabled:opacity-75 ${
                      touched.phone && errors.phone
                        ? "border-[#C96A6A]"
                        : "border-[#E5DACB]"
                    }`}
                  />
                  {touched.phone && errors.phone && (
                    <p className="text-[11px] text-[#C96A6A] flex items-center gap-1 font-sans">
                      <AlertCircle size={12} /> {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Reusable Address Selector */}
            {!isAddressesLoading && addresses.length > 0 && (
              <div className="bg-[#FFFAF1] border border-[#E5DACB] p-6 md:p-8 space-y-6 shadow-xs">
                <div className="flex justify-between items-center border-b border-[#E5DACB]/60 pb-3">
                  <h2 className="font-serif text-xl md:text-2xl text-[#25382E] font-normal">
                    Select Shipping Location
                  </h2>
                  {!isAddingNewAddress && !editingAddressId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewAddress(true);
                        setEditingAddressId(null);
                        setFormData({
                          fullName: profile?.full_name || "",
                          email: user?.email || "",
                          phone: "",
                          houseFlat: "",
                          street: "",
                          landmark: "",
                          city: "",
                          state: "",
                          pinCode: "",
                        });
                        setTouched({});
                      }}
                      className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.15em] font-medium text-[#EC8D99] hover:text-[#25382E] transition-colors cursor-pointer font-sans"
                    >
                      <Plus size={13} /> Add New
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const active = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
                        handleSelectAddress(active);
                      }}
                      className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F] hover:text-[#25382E] transition-colors cursor-pointer font-sans"
                    >
                      Use Saved Address
                    </button>
                  )}
                </div>

                {(!isAddingNewAddress && !editingAddressId) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectAddress(addr)}
                          className={`bg-[#FFFAF1] border p-5 flex flex-col justify-between cursor-pointer transition-colors duration-200 ${
                            isSelected
                              ? "border-[#25382E] ring-1 ring-[#25382E]"
                              : "border-[#E5DACB] hover:border-[#25382E]"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-serif text-base font-medium text-[#25382E] truncate">
                                {addr.full_name}
                              </h4>
                              {isSelected && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-medium tracking-[0.15em] uppercase px-2 py-0.5 bg-[#25382E] text-[#FFFAF1]">
                                  <Check size={9} /> Selected
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-[#5C745F] space-y-1 font-light leading-relaxed">
                              <p className="font-medium text-[#25382E]">{addr.house_flat}, {addr.street}</p>
                              {addr.landmark && <p className="italic text-[#5C745F]/70">Landmark: {addr.landmark}</p>}
                              <p>{addr.city}, {addr.state} - {addr.pin_code}</p>
                              <p className="pt-1.5 flex items-center gap-1 font-normal text-[#25382E]">
                                <span className="font-medium text-[#5C745F] text-[10px] uppercase tracking-wider">Phone:</span> {addr.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end border-t border-[#E5DACB]/50 pt-3 mt-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAddress(addr);
                              }}
                              className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#EC8D99] hover:text-[#25382E] transition-colors cursor-pointer font-sans"
                            >
                              Edit details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Selected Address Display card */}
            {!isFormActive && (
              <div className="bg-[#FFFAF1] border border-[#E5DACB] p-6 md:p-8 space-y-4 shadow-xs">
                <h2 className="font-serif text-xl md:text-2xl text-[#25382E] font-normal border-b border-[#E5DACB]/60 pb-3">
                  Selected Shipping Address
                </h2>
                <div className="font-sans text-sm text-[#5C745F] space-y-1 leading-relaxed">
                  <p className="font-medium text-[#25382E] text-base">{formData.fullName}</p>
                  <p>{formData.houseFlat}, {formData.street}</p>
                  {formData.landmark && <p className="italic text-[#5C745F]/70">Landmark: {formData.landmark}</p>}
                  <p>{formData.city}, {formData.state} - {formData.pinCode}</p>
                  <p className="pt-2"><span className="font-medium text-[#5C745F] text-xs uppercase tracking-wider">Phone:</span> {formData.phone}</p>
                  <p className="pt-1"><span className="font-medium text-[#5C745F] text-xs uppercase tracking-wider">Delivery Email:</span> {formData.email}</p>
                </div>
              </div>
            )}

            {/* Shipping Address Input Form */}
            {isFormActive && (
              <div className="bg-[#FFFAF1] border border-[#E5DACB] p-6 md:p-8 space-y-6 shadow-xs">
                <h2 className="font-serif text-xl md:text-2xl text-[#25382E] font-normal border-b border-[#E5DACB]/60 pb-3">
                  {editingAddressId ? "Edit Address Details" : "Enter Shipping Address"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
                  {/* House/Flat */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="houseFlat" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                      Flat, House No., Building, Apartment <span className="text-[#C96A6A]">*</span>
                    </label>
                    <input
                      type="text"
                      id="houseFlat"
                      name="houseFlat"
                      value={formData.houseFlat}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g. Apartment 4B, Sunflower Residency"
                      className={`w-full px-4 py-3 border bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] transition-colors ${
                        touched.houseFlat && errors.houseFlat
                          ? "border-[#C96A6A]"
                          : "border-[#E5DACB]"
                      }`}
                    />
                    {touched.houseFlat && errors.houseFlat && (
                      <p className="text-[11px] text-[#C96A6A] flex items-center gap-1 font-sans">
                        <AlertCircle size={12} /> {errors.houseFlat}
                      </p>
                    )}
                  </div>

                  {/* Street/Locality */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="street" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                      Area, Street, Sector, Village <span className="text-[#C96A6A]">*</span>
                    </label>
                    <input
                      type="text"
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g. 5th Main, Sector 7, HSR Layout"
                      className={`w-full px-4 py-3 border bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] transition-colors ${
                        touched.street && errors.street
                          ? "border-[#C96A6A]"
                          : "border-[#E5DACB]"
                      }`}
                    />
                    {touched.street && errors.street && (
                      <p className="text-[11px] text-[#C96A6A] flex items-center gap-1 font-sans">
                        <AlertCircle size={12} /> {errors.street}
                      </p>
                    )}
                  </div>

                  {/* Landmark */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="landmark" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                      Landmark <span className="text-[#5C745F]/50 text-[10px] font-normal lowercase">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="landmark"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleInputChange}
                      placeholder="e.g. Near HDFC Bank ATM"
                      className="w-full px-4 py-3 border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] transition-colors"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label htmlFor="city" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                      Town / City <span className="text-[#C96A6A]">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Enter city"
                      className={`w-full px-4 py-3 border bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] transition-colors ${
                        touched.city && errors.city
                          ? "border-[#C96A6A]"
                          : "border-[#E5DACB]"
                      }`}
                    />
                    {touched.city && errors.city && (
                      <p className="text-[11px] text-[#C96A6A] flex items-center gap-1 font-sans">
                        <AlertCircle size={12} /> {errors.city}
                      </p>
                    )}
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <label htmlFor="state" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                      State <span className="text-[#C96A6A]">*</span>
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border bg-[#FFFAF1] text-sm text-[#25382E] focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] transition-colors ${
                        touched.state && errors.state
                          ? "border-[#C96A6A]"
                          : "border-[#E5DACB]"
                      }`}
                    >
                      <option value="">Select State</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                      <option value="Assam">Assam</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Goa">Goa</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Manipur">Manipur</option>
                      <option value="Meghalaya">Meghalaya</option>
                      <option value="Mizoram">Mizoram</option>
                      <option value="Nagaland">Nagaland</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Sikkim">Sikkim</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Tripura">Tripura</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                      <option value="Ladakh">Ladakh</option>
                      <option value="Puducherry">Puducherry</option>
                    </select>
                    {touched.state && errors.state && (
                      <p className="text-[11px] text-[#C96A6A] flex items-center gap-1 font-sans">
                        <AlertCircle size={12} /> {errors.state}
                      </p>
                    )}
                  </div>

                  {/* PIN Code */}
                  <div className="space-y-1.5">
                    <label htmlFor="pinCode" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#7A6656]">
                      PIN Code <span className="text-[#C96A6A]">*</span>
                    </label>
                    <input
                      type="text"
                      id="pinCode"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      maxLength={6}
                      placeholder="6-digit PIN code"
                      className={`w-full px-4 py-3 border bg-[#FBF8F4] text-sm text-[#4A382D] placeholder-[#7A6656]/50 focus:outline-none focus:border-[#4A382D] focus:bg-[#FFFDF9] transition-colors ${
                        touched.pinCode && errors.pinCode
                          ? "border-[#C96A6A]"
                          : "border-[#DDD0C1]"
                      }`}
                    />
                    {touched.pinCode && errors.pinCode && (
                      <p className="text-[11px] text-[#C96A6A] flex items-center gap-1 font-sans">
                        <AlertCircle size={12} /> {errors.pinCode}
                      </p>
                    )}
                  </div>

                  {/* Save Checkbox (Only if adding a new address) */}
                  {!editingAddressId && (
                    <div className="md:col-span-2 pt-2 flex items-center">
                      <label className="relative flex items-center gap-2.5 cursor-pointer text-sm text-[#4A382D] select-none">
                        <input
                          type="checkbox"
                          checked={saveForFuture}
                          onChange={(e) => setSaveForFuture(e.target.checked)}
                          className="w-4 h-4 accent-[#4A382D] border-[#DDD0C1] rounded-sm cursor-pointer"
                        />
                        <span className="font-light">Save this address for future orders</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column - Order Summary & Payment Button */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            
            {/* Products review list */}
            <div className="bg-[#FFFDF9] border border-[#DDD0C1] p-6 md:p-8 space-y-6 shadow-xs">
              <h3 className="font-serif text-xl md:text-2xl text-[#4A382D] font-normal border-b border-[#DDD0C1]/60 pb-3">
                Items in Order
              </h3>
              
              <div className="divide-y divide-[#DDD0C1]/40 max-h-[280px] overflow-y-auto pr-1 no-scrollbar font-sans">
                {cart.map((item) => {
                  const lineTotal = item.product.price * item.quantity;
                  return (
                    <div key={item.product.id} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-center">
                      <div className="relative aspect-[3/4] w-12 overflow-hidden border border-[#DDD0C1] bg-[#FBF8F4] shrink-0">
                        <Image
                          src={item.product.image_url}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-serif text-sm font-medium text-[#4A382D] truncate">
                          {item.product.title}
                        </h4>
                        <p className="text-xs text-[#7A6656] font-sans">
                          Qty: {item.quantity} × ₹{item.product.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span className="font-serif text-sm font-medium text-[#4A382D] shrink-0">
                        ₹{lineTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price details */}
              <div className="border-t border-[#E5DACB]/60 pt-4 space-y-3 font-sans text-xs sm:text-sm">
                <div className="flex justify-between items-center text-[#5C745F]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#25382E]">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[#5C745F]">
                    <span>Standard Shipping</span>
                    <span className="text-[#25382E] font-medium text-sm">
                      {shipping === 0 ? "Complimentary" : `₹${shipping}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C745F]/75 leading-normal text-right italic font-light">
                    {shipping === 0 
                      ? `Complimentary delivery applied (orders ₹${SHIPPING_FREE_THRESHOLD}+).`
                      : `Standard ₹${SHIPPING_FLAT_CHARGE} delivery for orders under ₹${SHIPPING_FREE_THRESHOLD}.`
                    }
                  </p>
                </div>
                <div className="border-t border-[#E5DACB]/50 pt-3 flex justify-between items-end">
                  <span className="font-serif text-base text-[#25382E]">Grand Total</span>
                  <div className="text-right">
                    <span className="font-serif text-2xl font-light text-[#25382E]">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Razorpay Button or Order Success Block */}
              <div className="pt-2 space-y-4 font-sans">
                {createdOrder ? (
                  <div className="bg-[#405F4C]/10 border border-[#405F4C]/30 p-6 text-center space-y-3 animate-fadeIn">
                    <div className="w-10 h-10 bg-[#405F4C] text-[#FFFAF1] rounded-full flex items-center justify-center mx-auto shadow-xs">
                      <Check size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif text-lg font-medium text-[#25382E]">Order Confirmed</h4>
                      <p className="font-sans text-xs text-[#5C745F]">Order Number: <strong className="font-medium text-[#25382E]">{createdOrder.number}</strong></p>
                      <div className="font-sans text-[11px] text-[#5C745F] mt-2 space-y-1.5 leading-relaxed">
                        <p className="font-medium text-[#25382E]">Payment verified successfully.</p>
                        <p>Thank you for choosing AaaS Handmade Crochet.</p>
                        <p>Your piece is now being thoughtfully prepared.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {submitError && (
                      <div className="bg-[#C96A6A]/10 border border-[#C96A6A]/30 p-4 flex gap-2 text-xs text-[#C96A6A] font-sans">
                        <AlertCircle className="shrink-0 mt-0.5 text-[#C96A6A]" size={16} />
                        <span className="whitespace-pre-line">{submitError}</span>
                      </div>
                    )}
                    {activeOrder ? (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => handleProceedPayment()}
                          disabled={isSubmitting}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] font-medium uppercase tracking-[0.2em] text-xs transition-colors duration-200 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-sans"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-[#FFFAF1]/30 border-t-[#FFFAF1] rounded-full animate-spin shrink-0" />
                              <span>Preparing Secure Gateway...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={15} />
                              <span>Retry Payment</span>
                            </>
                          )}
                        </button>
                        
                        <Link
                          href="/cart"
                          className="w-full flex items-center justify-center gap-3 py-4 border border-[#25382E] text-[#25382E] hover:bg-[#25382E] hover:text-[#FFFAF1] font-medium uppercase tracking-[0.2em] text-xs transition-colors duration-200 text-center cursor-pointer font-sans"
                        >
                          Return to Bag
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] font-medium uppercase tracking-[0.2em] text-xs transition-colors duration-200 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-sans"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-[#FFFAF1]/30 border-t-[#FFFAF1] rounded-full animate-spin shrink-0" />
                            <span>Opening Secure Payment...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard size={15} />
                            <span>Proceed to Payment</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Need Help WhatsApp block */}
            <div className="bg-[#FFFAF1] border border-[#E5DACB] p-5 shadow-xs text-center space-y-1.5 animate-fadeIn">
              <span className="text-xs text-[#5C745F] font-sans block">Need assistance with your bespoke order?</span>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp for order assistance"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#25382E] hover:text-[#EC8D99] transition-colors uppercase tracking-[0.15em] font-sans"
              >
                <MessageCircle size={14} className="text-[#405F4C] transition-transform duration-300 hover:scale-110" />
                <span>Chat with our Atelier on WhatsApp</span>
              </a>
            </div>

          </div>
        </form>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-24 bg-background animate-pulse">
          <div className="w-12 h-12 rounded-full bg-border-custom/50 mx-auto" />
          <div className="h-4 w-32 bg-border-custom/50 rounded mx-auto mt-4" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
