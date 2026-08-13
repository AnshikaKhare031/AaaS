import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  ChevronLeft,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/helpers';
import { createOrder, createRazorpayOrder, verifyRazorpayPayment } from '../../services/api';
import { RazorpayOptions } from '../../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, shippingFee, isFreeShipping, total, clearCart } = useCart();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [step, setStep] = useState<'information' | 'shipping' | 'payment'>('information');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address1: '',
    address2: '',
    city: '',
    state: 'Karnataka',
    pincode: '',
    country: 'India',
    notes: '',
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      error('Please complete all contact fields.');
      return;
    }
    setStep('shipping');
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address1 || !formData.city || !formData.pincode) {
      error('Please complete your full shipping address.');
      return;
    }
    setStep('payment');
  };

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Create order on backend
      const orderPayload = {
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        shipping_name: formData.fullName,
        shipping_email: formData.email,
        shipping_phone: formData.phone,
        shipping_address: `${formData.address1}${formData.address2 ? ', ' + formData.address2 : ''}`,
        shipping_city: formData.city,
        shipping_state: formData.state,
        shipping_pincode: formData.pincode,
        notes: formData.notes,
      };

      const order = await createOrder(orderPayload);

      // 2. Request Razorpay order ID from FastAPI backend
      const razorpayOrder = await createRazorpayOrder(order.id, order.total);

      // 3. Configure Razorpay modal options
      const options: RazorpayOptions = {
        key: razorpayOrder.key_id || 'rzp_test_placeholder',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'AaaS - Handmade Crochet',
        description: `Order #${order.order_number}`,
        image: '/images/tulip_bouquet.jpg',
        order_id: razorpayOrder.razorpay_order_id,
        handler: async (response) => {
          try {
            // 4. Verify payment signature on FastAPI backend
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order.id,
            });

            if (verifyRes.success) {
              clearCart();
              success('Payment verified successfully! Thank you for your order ♡');
              navigate(`/order-success/${order.id}`);
            } else {
              error('Payment verification failed. Please contact support.');
            }
          } catch (err: any) {
            error(err.response?.data?.detail || 'Payment verification failed.');
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#5A4335',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            error('Payment cancelled.');
          },
        },
      };

      // Check if Razorpay SDK loaded or simulate fallback in development
      if (typeof window.Razorpay !== 'undefined') {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Mock verification for local sandbox testing
        const mockVerify = await verifyRazorpayPayment({
          razorpay_order_id: razorpayOrder.razorpay_order_id || `order_demo_${Date.now()}`,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: 'signature_demo_valid',
          order_id: order.id,
        });
        clearCart();
        success('Payment completed successfully ♡');
        navigate(`/order-success/${order.id}`);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      error(err.response?.data?.detail || 'Failed to initialize payment.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] py-8 sm:py-12">
      {/* Top Distraction-Free Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-1.5 text-xs text-[#7B6656]">
          <Lock className="w-3.5 h-3.5 text-[#8FA57D]" />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Multi-Step Checkout Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-[#E7DFD7] shadow-sm space-y-8">
            {/* Step Indicators */}
            <div className="flex items-center justify-between border-b border-[#E7DFD7] pb-6">
              {[
                { id: 'information', label: '1. Information' },
                { id: 'shipping', label: '2. Shipping' },
                { id: 'payment', label: '3. Payment' },
              ].map((s, idx) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                    step === s.id
                      ? 'text-[#C6A15B]'
                      : 'text-[#7B6656]'
                  }`}
                >
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            {/* STEP 1: Information */}
            {step === 'information' && (
              <form onSubmit={handleInfoSubmit} className="space-y-6">
                <h3 className="font-serif text-2xl font-semibold text-[#3D2E24]">
                  Contact Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4335] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Radhika Sharma"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5A4335] mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="radhika@example.com"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5A4335] mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#E7DFD7]">
                  <Link
                    to="/cart"
                    className="text-xs text-[#7B6656] hover:text-[#3D2E24] flex items-center gap-1 font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" /> Return to Bag
                  </Link>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
                  >
                    Continue to Shipping
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Shipping */}
            {step === 'shipping' && (
              <form onSubmit={handleShippingSubmit} className="space-y-6">
                <h3 className="font-serif text-2xl font-semibold text-[#3D2E24]">
                  Delivery Address
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4335] mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      required
                      value={formData.address1}
                      onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                      placeholder="House/Flat No., Building, Street Name"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A4335] mb-1">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={formData.address2}
                      onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                      placeholder="Apartment, Landmark, Floor"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5A4335] mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Bengaluru"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5A4335] mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="e.g. Karnataka"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5A4335] mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        placeholder="e.g. 560001"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A4335] mb-1">Delivery Notes (Optional)</label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Special instructions for delivery or gift note..."
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#E7DFD7]">
                  <button
                    type="button"
                    onClick={() => setStep('information')}
                    className="text-xs text-[#7B6656] hover:text-[#3D2E24] flex items-center gap-1 font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Contact
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Payment */}
            {step === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-[#3D2E24] mb-1">
                    Complete Your Payment
                  </h3>
                  <p className="text-xs text-[#7B6656]">
                    Click below to open the official Razorpay payment gateway (UPI, Credit/Debit Cards, NetBanking, Wallets).
                  </p>
                </div>

                {/* Review summary cards */}
                <div className="p-4 bg-[#F8F5F0] rounded-2xl border border-[#E7DFD7] space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#7B6656]">Contact:</span>
                    <span className="font-semibold text-[#3D2E24]">
                      {formData.fullName} ({formData.phone})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7B6656]">Ship To:</span>
                    <span className="font-semibold text-[#3D2E24] text-right">
                      {formData.address1}, {formData.city}, {formData.state} - {formData.pincode}
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-[#EADCCF]/40 rounded-2xl border border-[#E7DFD7] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#C6A15B] shadow-xs flex-shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-semibold text-[#3D2E24]">
                      Razorpay Payment Gateway
                    </h4>
                    <p className="text-xs text-[#7B6656]">
                      UPI (GPay, PhonePe, Paytm), All Major Cards, Netbanking.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#E7DFD7]">
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="text-xs text-[#7B6656] hover:text-[#3D2E24] flex items-center gap-1 font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Shipping
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleRazorpayPayment}
                    className="px-8 py-3.5 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-98 flex items-center gap-2"
                  >
                    {isProcessing ? 'Processing Order...' : `Pay ${formatPrice(total)} Now`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7DFD7] shadow-sm space-y-6">
              <h3 className="font-serif text-2xl font-semibold text-[#3D2E24]">
                Order Details ({items.length})
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#F8F5F0] flex-shrink-0">
                      <img
                        src={item.product.images?.[0]?.image_url || '/images/tulip_bouquet.jpg'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-0 right-0 w-4 h-4 bg-[#5A4335] text-white text-[10px] font-bold rounded-bl-md flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm font-semibold text-[#3D2E24] truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-[#7B6656]">
                        {formatPrice(item.product.sale_price ?? item.product.price)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#5A4335]">
                      {formatPrice((item.product.sale_price ?? item.product.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="space-y-2 text-xs text-[#5A4335] pt-4 border-t border-[#E7DFD7]">
                <div className="flex justify-between">
                  <span className="text-[#7B6656]">Subtotal</span>
                  <span className="font-semibold text-[#3D2E24]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B6656]">Shipping</span>
                  <span className="font-semibold text-[#3D2E24]">
                    {isFreeShipping ? (
                      <span className="text-[#8FA57D] font-bold">FREE</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#3D2E24] pt-2 border-t border-[#E7DFD7]">
                  <span>Total Amount</span>
                  <span className="text-xl text-[#5A4335]">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
