import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/helpers';

export const CartPage: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    shippingFee,
    isFreeShipping,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [giftNote, setGiftNote] = useState('');
  const navigate = useNavigate();

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / (freeShippingThreshold || 1499)) * 100)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7DFD7] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block mb-1">
            Review Bag
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">
            Shopping Bag ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h1>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-[#C96A6A] hover:underline font-medium flex items-center gap-1 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Empty Bag
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E7DFD7] p-12 sm:p-16 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#EADCCF]/60 flex items-center justify-center text-[#7B6656] mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 opacity-60 text-[#C6A15B]" />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-[#3D2E24] mb-2">
            Your cart is waiting for something handmade
          </h3>
          <p className="text-xs text-[#7B6656] mb-6 leading-relaxed">
            Discover our collection of handcrafted crochet floral stems, bags, and artisan accessories.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] transition-colors shadow-md"
          >
            Explore Collection <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-6">
            {/* Free Shipping Bar */}
            <div className="bg-[#EADCCF]/50 p-4 rounded-2xl border border-[#E7DFD7] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#5A4335]">
                {isFreeShipping ? (
                  <span className="text-[#8FA57D] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Free Shipping unlocked on this order!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-[#C6A15B]">{formatPrice(amountNeededForFreeShipping)}</strong> more to get Free Shipping
                  </span>
                )}
                <span>{freeShippingProgress}%</span>
              </div>
              <div className="w-full bg-[#DDD6CF] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#C6A15B] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* Table / List */}
            <div className="space-y-4">
              {items.map((item) => {
                const unitPrice = item.product.sale_price ?? item.product.price;
                const itemSubtotal = unitPrice * item.quantity;
                const imageSrc = item.product.images?.[0]?.image_url || '/images/tulip_bouquet.jpg';

                return (
                  <div
                    key={item.product_id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={imageSrc}
                        alt={item.product.name}
                        className="w-20 h-20 rounded-xl object-cover bg-[#F8F5F0] flex-shrink-0"
                      />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#7B6656]">
                          {item.product.category?.name}
                        </span>
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="block font-serif text-lg font-semibold text-[#3D2E24] hover:text-[#C6A15B]"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-[#7B6656]">{formatPrice(unitPrice)} each</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E7DFD7]">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#E7DFD7] rounded-xl bg-[#F8F5F0]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="px-2.5 py-1 text-[#5A4335] hover:bg-[#EADCCF] rounded-l-xl transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-[#3D2E24]">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="px-2.5 py-1 text-[#5A4335] hover:bg-[#EADCCF] rounded-r-xl transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <span className="font-sans text-sm font-bold text-[#5A4335] min-w-[70px] text-right">
                        {formatPrice(itemSubtotal)}
                      </span>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-[#7B6656] hover:text-[#C96A6A] transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gift Note Accordion */}
            <div className="bg-white p-5 rounded-2xl border border-[#E7DFD7]">
              <label className="block text-xs font-semibold text-[#5A4335] mb-1">
                Personalized Handwritten Gift Note (Optional)
              </label>
              <textarea
                rows={2}
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                placeholder="Include a handwritten message on luxury gold-foil cardstock..."
                className="w-full px-3.5 py-2 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
              />
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-[#E7DFD7] p-6 sm:p-8 shadow-sm space-y-6 sticky top-28">
              <h3 className="font-serif text-2xl font-semibold text-[#3D2E24]">Order Summary</h3>

              <div className="space-y-3 text-xs text-[#5A4335] border-b border-[#E7DFD7] pb-4">
                <div className="flex justify-between">
                  <span className="text-[#7B6656]">Items Subtotal</span>
                  <span className="font-semibold text-[#3D2E24]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B6656]">Shipping Fee</span>
                  <span className="font-semibold text-[#3D2E24]">
                    {isFreeShipping ? (
                      <span className="text-[#8FA57D] font-bold">FREE</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline text-base font-bold text-[#3D2E24]">
                <span>Estimated Total</span>
                <span className="text-2xl text-[#5A4335]">{formatPrice(total)}</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#7B6656]">
                <ShieldCheck className="w-4 h-4 text-[#8FA57D]" />
                <span>100% Secure Razorpay Checkout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
