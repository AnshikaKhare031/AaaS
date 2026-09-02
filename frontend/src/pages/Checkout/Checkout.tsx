import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, ArrowLeft, CheckCircle2, Lock, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/helpers';

export const CheckoutPage: React.FC = () => {
  const { items, itemCount, subtotal, shippingFee, isFreeShipping, total, clearCart } = useCart();
  const navigate = useNavigate();
  const { success, error: showToastError } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Delhi',
    pincode: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToastError('Your bag is empty.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setOrderPlaced(true);
      clearCart();
      success('Order initiated! Native payment gateway integration will be completed in Phase 3.');
    }, 1200);
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-[#8FA57D]/15 text-[#8FA57D] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#3D2E24]">Thank You for Your Order!</h1>
        <p className="text-sm text-[#7B6656] max-w-md mx-auto">
          Your order request has been received. Our atelier team is preparing your handcrafted pieces with meticulous care.
        </p>
        <div className="pt-4">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#3D2E24] transition-colors shadow-md"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-[#EADCCF]/60 rounded-full flex items-center justify-center mx-auto text-[#7B6656]">
          <ShoppingBag className="w-8 h-8 opacity-60 text-[#C6A15B]" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#3D2E24]">Your Bag is Empty</h1>
        <p className="text-xs text-[#7B6656]">Add handcrafted items to your bag before proceeding to checkout.</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] transition-colors"
        >
          Explore Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      <div className="flex items-center justify-between border-b border-[#E7DFD7] pb-6">
        <div>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-xs text-[#7B6656] hover:text-[#3D2E24] font-medium mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">Checkout</h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8FA57D] bg-[#8FA57D]/10 px-3 py-1.5 rounded-full">
          <Lock className="w-3.5 h-3.5" />
          <span>Secure Checkout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Shipping Form */}
        <div className="lg:col-span-7 space-y-8">
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7DFD7] shadow-sm space-y-6">
              <h2 className="font-serif text-xl font-semibold text-[#3D2E24]">Delivery Address</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#5A4335] mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Ananya Sharma"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4335] mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="ananya@example.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4335] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#5A4335] mb-1">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House / Flat No., Apartment / Society, Street"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4335] mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New Delhi"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4335] mb-1">PIN Code</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="110001"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7DFD7] shadow-sm space-y-4">
              <h2 className="font-serif text-xl font-semibold text-[#3D2E24]">Payment Method</h2>
              <div className="p-4 rounded-2xl bg-[#F8F5F0] border border-[#E7DFD7] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-4 border-[#5A4335] bg-white" />
                  <div>
                    <p className="text-xs font-bold text-[#3D2E24]">Native Checkout / Razorpay</p>
                    <p className="text-[11px] text-[#7B6656]">UPI, Cards, NetBanking, Wallets</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#C6A15B]/20 text-[#5A4335] rounded-full">
                  Standard
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? 'Processing Order...' : `Place Order • ${formatPrice(total)}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-[#E7DFD7] p-6 sm:p-8 shadow-sm space-y-6 sticky top-28">
            <h2 className="font-serif text-2xl font-semibold text-[#3D2E24]">
              Order Summary ({itemCount})
            </h2>

            <div className="divide-y divide-[#E7DFD7]/60 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <img
                    src={item.product.images?.[0]?.image_url || '/images/tulip_bouquet.jpg'}
                    alt={item.product.name}
                    className="w-14 h-14 rounded-lg object-cover bg-[#F8F5F0] flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#3D2E24] truncate">{item.product.name}</p>
                    <p className="text-[11px] text-[#7B6656]">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-[#5A4335]">
                    {formatPrice((item.product.sale_price ?? item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 text-xs text-[#5A4335] border-t border-[#E7DFD7] pt-4">
              <div className="flex justify-between">
                <span className="text-[#7B6656]">Items Subtotal</span>
                <span className="font-semibold text-[#3D2E24]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B6656]">Shipping Fee</span>
                <span className="font-semibold text-[#3D2E24]">
                  {isFreeShipping ? <span className="text-[#8FA57D] font-bold">FREE</span> : formatPrice(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#3D2E24] pt-2 border-t border-[#E7DFD7]">
                <span>Total Amount</span>
                <span className="text-2xl text-[#5A4335]">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#7B6656] text-center border-t border-[#E7DFD7]">
              <ShieldCheck className="w-4 h-4 text-[#8FA57D] flex-shrink-0" />
              <span>Guaranteed safe & secure checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
