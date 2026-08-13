import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice, getStockBadge } from '../../utils/helpers';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isFavorited = isInWishlist(product.id);
  const stockInfo = getStockBadge(product.stock_quantity, product.low_stock_threshold);

  const mainImage = product.images?.[0]?.image_url || '/images/tulip_bouquet.jpg';
  const secondaryImage =
    product.images?.[1]?.image_url || product.images?.[0]?.image_url || mainImage;

  const currentPrice = product.sale_price ?? product.price;
  const hasDiscount = product.sale_price !== null && product.sale_price !== undefined && product.sale_price < product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative flex flex-col bg-white rounded-2xl border border-[#E7DFD7] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#3D2E24]/5 hover:border-[#DDD6CF]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Box */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F8F5F0]">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={isHovered && secondaryImage ? secondaryImage : mainImage}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.is_bestseller && (
            <span className="px-2.5 py-1 bg-[#5A4335] text-white text-[10px] uppercase font-bold tracking-wider rounded-md shadow-xs">
              Bestseller
            </span>
          )}
          {product.is_new && (
            <span className="px-2.5 py-1 bg-[#8FA57D] text-white text-[10px] uppercase font-bold tracking-wider rounded-md shadow-xs">
              New
            </span>
          )}
          {hasDiscount && (
            <span className="px-2.5 py-1 bg-[#C6A15B] text-white text-[10px] uppercase font-bold tracking-wider rounded-md shadow-xs">
              Sale
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center transition-all duration-200 z-10 shadow-xs ${
            isFavorited
              ? 'text-[#C96A6A] hover:bg-white'
              : 'text-[#7B6656] hover:text-[#C96A6A] hover:bg-white'
          }`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Action Overlay buttons */}
        <div className="absolute bottom-3 inset-x-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            type="button"
            disabled={!stockInfo.isAvailable}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(product, 1);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md ${
              stockInfo.isAvailable
                ? 'bg-[#5A4335] hover:bg-[#3D2E24] text-white active:scale-98'
                : 'bg-[#DDD6CF] text-[#7B6656] cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {stockInfo.isAvailable ? 'Add to Cart' : 'Out of Stock'}
          </button>

          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="w-10 h-10 rounded-xl bg-white text-[#5A4335] hover:text-[#C6A15B] hover:bg-[#FBF8F4] flex items-center justify-center transition-colors shadow-md border border-[#E7DFD7]"
              title="Quick view"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Category / Stock note */}
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-[#7B6656] font-medium uppercase tracking-wider">
              {product.category?.name || 'Handmade Crochet'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${stockInfo.color}`}>
              {stockInfo.label}
            </span>
          </div>

          {/* Product Title */}
          <Link to={`/product/${product.slug}`} className="block group-hover:text-[#C6A15B] transition-colors">
            <h3 className="font-serif text-lg font-semibold text-[#3D2E24] leading-snug line-clamp-1">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 pt-1 border-t border-[#E7DFD7]/60">
          <span className="text-base font-bold text-[#5A4335] font-sans">
            {formatPrice(currentPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-[#7B6656] line-through font-sans">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
