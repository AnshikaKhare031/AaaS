import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { formatPrice, getStockBadge } from '../../utils/helpers';

export const WishlistPage: React.FC = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7DFD7] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block mb-1">
            Saved Favorites
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">
            My Wishlist ({items.length})
          </h1>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-xs text-[#C96A6A] hover:underline font-medium flex items-center gap-1 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Wishlist
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E7DFD7] p-12 sm:p-16 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#EADCCF]/60 flex items-center justify-center text-[#7B6656] mx-auto mb-4">
            <Heart className="w-8 h-8 opacity-60 text-[#C6A15B]" />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-[#3D2E24] mb-2">
            Save the pieces you love
          </h3>
          <p className="text-xs text-[#7B6656] mb-6 leading-relaxed">
            Your wishlist is currently empty. Explore our catalog and tap the heart icon on any piece to save it for later.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] transition-colors shadow-md"
          >
            Explore Collection <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const product = item.product;
            const stockInfo = getStockBadge(product.stock_quantity, product.low_stock_threshold);
            const currentPrice = product.sale_price ?? product.price;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E7DFD7] shadow-xs overflow-hidden flex flex-col justify-between group"
              >
                <div className="relative aspect-square bg-[#F8F5F0]">
                  <Link to={`/product/${product.slug}`}>
                    <img
                      src={product.images?.[0]?.image_url || '/images/tulip_bouquet.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-[#7B6656] hover:text-[#C96A6A] flex items-center justify-center shadow-xs"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#7B6656] uppercase tracking-wider">{product.category?.name}</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${stockInfo.color}`}>
                        {stockInfo.label}
                      </span>
                    </div>
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-serif text-base font-semibold text-[#3D2E24] hover:text-[#C6A15B] line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm font-bold text-[#5A4335] mt-1">
                      {formatPrice(currentPrice)}
                    </p>
                  </div>

                  <button
                    disabled={!stockInfo.isAvailable}
                    onClick={() => addToCart(product, 1)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      stockInfo.isAvailable
                        ? 'bg-[#5A4335] hover:bg-[#3D2E24] text-white shadow-xs'
                        : 'bg-[#DDD6CF] text-[#7B6656] cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {stockInfo.isAvailable ? 'Move to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
