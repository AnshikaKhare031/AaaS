import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ExternalLink, ShoppingBag, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/helpers';
import { buildAmazonCartUrl } from '../../utils/amazon';

export const CartDrawer: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    shippingFee,
    isFreeShipping,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    total,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const navigate = useNavigate();
  const { error: showToastError } = useToast();

  const itemsWithAsin = items.filter(
    (i) => i.product.amazon_asin && i.product.amazon_asin.trim().length > 0
  );
  const skippedCount = items.length - itemsWithAsin.length;

  const handleProceedToAmazon = () => {
    if (itemsWithAsin.length === 0) {
      showToastError("These items don't have Amazon links yet — please check back soon.");
      return;
    }

    const amazonUrl = buildAmazonCartUrl(
      itemsWithAsin.map((item) => ({
        asin: item.product.amazon_asin!,
        quantity: item.quantity,
      }))
    );

    if (!amazonUrl) {
      showToastError("These items don't have Amazon links yet — please check back soon.");
      return;
    }

    closeCartDrawer();
    window.open(amazonUrl, '_blank', 'noopener,noreferrer');
  };

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / (freeShippingThreshold || 1499)) * 100)
  );

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCartDrawer}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#F8F5F0] z-50 shadow-2xl flex flex-col justify-between overflow-hidden border-l border-[#E7DFD7]"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#E7DFD7] bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#5A4335]" />
                <h3 className="font-serif text-xl font-bold text-[#3D2E24]">
                  Shopping Bag ({itemCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCartDrawer}
                className="p-1.5 text-[#7B6656] hover:text-[#3D2E24] rounded-lg transition-colors"
                aria-label="Close cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Indicator */}
            <div className="bg-[#EADCCF]/60 px-5 py-3 border-b border-[#E7DFD7]">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                {isFreeShipping ? (
                  <span className="text-[#8FA57D] font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Congratulations! You unlocked Free Shipping
                  </span>
                ) : (
                  <span className="text-[#5A4335]">
                    Add <strong className="text-[#C6A15B]">{formatPrice(amountNeededForFreeShipping)}</strong> more for Free Shipping
                  </span>
                )}
                <span className="text-[#7B6656] text-[11px]">{freeShippingProgress}%</span>
              </div>
              <div className="w-full bg-[#DDD6CF] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#C6A15B] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-[#EADCCF]/60 flex items-center justify-center text-[#7B6656] mb-4">
                    <ShoppingBag className="w-8 h-8 opacity-60" />
                  </div>
                  <h4 className="font-serif text-xl font-semibold text-[#3D2E24] mb-2">
                    Your bag is empty
                  </h4>
                  <p className="text-xs text-[#7B6656] max-w-xs mb-6 leading-relaxed">
                    Your cart is waiting for something handmade and special. Explore our timeless collections.
                  </p>
                  <button
                    onClick={() => {
                      closeCartDrawer();
                      navigate('/shop');
                    }}
                    className="px-6 py-2.5 bg-[#5A4335] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] transition-colors"
                  >
                    Explore Collection
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const unitPrice = item.product.sale_price ?? item.product.price;
                  const itemSubtotal = unitPrice * item.quantity;
                  const imageSrc = item.product.images?.[0]?.image_url || '/images/tulip_bouquet.jpg';

                  return (
                    <div
                      key={item.product_id}
                      className="flex gap-3 bg-white p-3 rounded-xl border border-[#E7DFD7] shadow-2xs relative group"
                    >
                      {/* Image Thumbnail */}
                      <Link
                        to={`/product/${item.product.slug}`}
                        onClick={closeCartDrawer}
                        className="w-20 h-20 rounded-lg overflow-hidden bg-[#F8F5F0] flex-shrink-0"
                      >
                        <img
                          src={imageSrc}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/product/${item.product.slug}`}
                            onClick={closeCartDrawer}
                            className="font-serif text-sm font-semibold text-[#3D2E24] hover:text-[#C6A15B] line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product_id)}
                            className="text-[#7B6656] hover:text-[#C96A6A] transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#7B6656]">
                            {formatPrice(unitPrice)} each
                          </span>
                          {item.product.amazon_asin ? (
                            <span className="text-[9px] font-medium text-[#8FA57D] bg-[#8FA57D]/10 px-1 py-0.5 rounded">
                              Amazon
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-[#C96A6A] bg-[#C96A6A]/10 px-1 py-0.5 rounded">
                              Custom
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#E7DFD7]/60">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-[#E7DFD7] rounded-lg bg-[#F8F5F0]">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              className="px-2 py-1 text-[#5A4335] hover:text-[#3D2E24] hover:bg-[#EADCCF] rounded-l-lg transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-[#3D2E24]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              className="px-2 py-1 text-[#5A4335] hover:text-[#3D2E24] hover:bg-[#EADCCF] rounded-r-lg transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <span className="text-xs font-bold text-[#5A4335]">
                            {formatPrice(itemSubtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer / Summary */}
            {items.length > 0 && (
              <div className="p-5 bg-white border-t border-[#E7DFD7] flex flex-col gap-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#7B6656]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#3D2E24]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#7B6656]">
                    <span>Estimated Shipping</span>
                    <span className="font-semibold text-[#3D2E24]">
                      {isFreeShipping ? (
                        <span className="text-[#8FA57D] font-bold">FREE</span>
                      ) : (
                        formatPrice(shippingFee)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#3D2E24] pt-2 border-t border-[#E7DFD7]">
                    <span>Total Amount</span>
                    <span className="text-base text-[#5A4335]">{formatPrice(total)}</span>
                  </div>
                </div>

                {skippedCount > 0 && itemsWithAsin.length > 0 && (
                  <div className="p-2.5 bg-[#EADCCF]/60 rounded-xl border border-[#E7DFD7] flex items-start gap-2 text-[11px] text-[#7B6656]">
                    <AlertCircle className="w-3.5 h-3.5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                    <p>
                      Note: <strong className="text-[#3D2E24]">{skippedCount} item(s)</strong> without Amazon links won't be included.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleProceedToAmazon}
                    className="w-full py-3 bg-[#5A4335] hover:bg-[#3D2E24] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                  >
                    Continue to Amazon <ExternalLink className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      closeCartDrawer();
                      navigate('/cart');
                    }}
                    className="w-full py-2.5 text-center text-xs font-semibold text-[#5A4335] hover:text-[#3D2E24] hover:bg-[#F8F5F0] rounded-xl transition-colors"
                  >
                    View Full Shopping Bag
                  </button>

                  <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-[#7B6656]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8FA57D]" />
                    <span>Secure Amazon Checkout</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
