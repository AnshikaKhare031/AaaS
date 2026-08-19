import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Star,
  Plus,
  Minus,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Product, Review } from '../../types';
import { getProductBySlug, getProducts, getProductReviews, submitReview } from '../../services/api';
import { formatPrice, getStockBadge, formatDate } from '../../utils/helpers';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { ProductCard } from '../../components/products/ProductCard';
import { buildAmazonSingleItemUrl } from '../../utils/amazon';
import { buildWhatsAppSingleItemUrl } from '../../utils/whatsapp';

export const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'materials' | 'care' | 'shipping'>('description');

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { success, error } = useToast();

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const prod = await getProductBySlug(slug);
        setProduct(prod);
        setSelectedImageIndex(0);
        setQuantity(1);

        if (prod) {
          // Fetch reviews and related products
          const [revRes, relRes] = await Promise.all([
            getProductReviews(prod.id).catch(() => []),
            getProducts({ category: prod.category?.slug, limit: 4 }).catch(() => ({ products: [] })),
          ]);
          setReviews(revRes);
          setRelatedProducts(relRes.products.filter((p) => p.id !== prod.id).slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 w-48 bg-[#EADCCF]/40 rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-[#EADCCF]/40 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-[#EADCCF]/40 rounded-md" />
            <div className="h-6 w-1/4 bg-[#EADCCF]/40 rounded-md" />
            <div className="h-24 bg-[#EADCCF]/40 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-[#E7DFD7] text-center">
        <h2 className="font-serif text-2xl font-bold text-[#3D2E24] mb-2">Product Not Found</h2>
        <p className="text-xs text-[#7B6656] mb-6">
          The handmade creation you are looking for may have retired or moved.
        </p>
        <Link
          to="/shop"
          className="px-6 py-2.5 bg-[#5A4335] text-white text-xs font-semibold uppercase tracking-wider rounded-xl inline-block"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: '1', product_id: product.id, image_url: '/images/tulip_bouquet.jpg', display_order: 1 }];

  const currentPrice = product.sale_price ?? product.price;
  const hasDiscount = product.sale_price !== null && product.sale_price !== undefined && product.sale_price < product.price;
  const stockInfo = getStockBadge(product.stock_quantity, product.low_stock_threshold);
  const isFavorited = isInWishlist(product.id);

  const handleBuyNow = () => {
    if (product.amazon_asin && product.amazon_asin.trim().length > 0) {
      const amazonUrl = buildAmazonSingleItemUrl(product.amazon_asin, quantity);
      if (amazonUrl) {
        window.open(amazonUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    const whatsappUrl = buildWhatsAppSingleItemUrl(product.name, currentPrice, quantity);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) {
      error('Please fill in your name and review message.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const newRev = await submitReview({
        product_id: product.id,
        rating: reviewRating,
        comment: reviewComment,
        customer_name: reviewerName,
      });
      setReviews((prev) => [newRev, ...prev]);
      setReviewComment('');
      setReviewerName('');
      success('Thank you for your beautiful review ♡');
    } catch (err) {
      error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[#7B6656]">
        <Link to="/" className="hover:text-[#3D2E24]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-[#3D2E24]">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        {product.category && (
          <>
            <Link to={`/shop?category=${product.category.slug}`} className="hover:text-[#3D2E24]">
              {product.category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
          </>
        )}
        <span className="text-[#3D2E24] font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[550px] no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 bg-[#F8F5F0] transition-all ${
                    selectedImageIndex === idx
                      ? 'border-[#C6A15B] shadow-md scale-95'
                      : 'border-[#E7DFD7] hover:border-[#7B6656]'
                  }`}
                >
                  <img src={img.image_url} alt={product.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Large Display Image */}
          <div className="flex-1 aspect-square rounded-3xl overflow-hidden border border-[#E7DFD7] bg-white relative group shadow-sm">
            <img
              src={images[selectedImageIndex]?.image_url || '/images/tulip_bouquet.jpg'}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-[#C6A15B] text-white text-xs font-bold uppercase rounded-lg shadow-md">
                Special Offer
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Product Info & Purchase Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            {/* Category & Stock */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B]">
                {product.category?.name || 'Handmade Crochet'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stockInfo.color}`}>
                {stockInfo.label}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24] leading-tight">
              {product.name}
            </h1>

            {/* Ratings summary */}
            <div className="flex items-center gap-2 text-xs text-[#7B6656]">
              <div className="flex text-[#C6A15B]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span>({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="font-sans text-3xl font-bold text-[#5A4335]">
                {formatPrice(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="font-sans text-lg text-[#7B6656] line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Short editorial snippet */}
            <p className="text-xs sm:text-sm text-[#7B6656] leading-relaxed pt-2">
              {product.description}
            </p>
          </div>

          {/* Actions: Quantity + Add to Cart + Buy Now + Wishlist */}
          <div className="space-y-4 pt-4 border-t border-[#E7DFD7]">
            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-[#5A4335] uppercase tracking-wider">
                Quantity:
              </span>
              <div className="flex items-center border border-[#E7DFD7] rounded-xl bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 text-[#5A4335] hover:bg-[#F8F5F0] rounded-l-xl transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-bold text-[#3D2E24]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (quantity < product.stock_quantity) {
                      setQuantity(quantity + 1);
                    } else {
                      error(`Only ${product.stock_quantity} available in stock.`);
                    }
                  }}
                  className="p-2.5 text-[#5A4335] hover:bg-[#F8F5F0] rounded-r-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-[#7B6656]">
                {product.stock_quantity} units in stock
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={!stockInfo.isAvailable}
                onClick={() => addToCart(product, quantity)}
                className={`flex-1 py-3.5 px-6 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                  stockInfo.isAvailable
                    ? 'bg-[#5A4335] hover:bg-[#3D2E24] text-white'
                    : 'bg-[#DDD6CF] text-[#7B6656] cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-4 h-4" /> Add to Cart
              </button>

              <button
                type="button"
                disabled={!stockInfo.isAvailable}
                onClick={handleBuyNow}
                title={product.amazon_asin ? 'Buy directly on Amazon' : 'Order via WhatsApp'}
                className={`flex-1 py-3.5 px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 ${
                  stockInfo.isAvailable
                    ? 'bg-[#C6A15B] hover:bg-[#b08d47] text-[#3D2E24]'
                    : 'bg-[#DDD6CF] text-[#7B6656] cursor-not-allowed'
                }`}
              >
                {product.amazon_asin ? 'Buy on Amazon' : 'Order via WhatsApp'}
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`w-12 h-12 rounded-xl border border-[#E7DFD7] flex items-center justify-center transition-colors shadow-xs ${
                  isFavorited
                    ? 'bg-[#C96A6A]/10 text-[#C96A6A] border-[#C96A6A]/30'
                    : 'bg-white text-[#7B6656] hover:text-[#C96A6A]'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-2 gap-3 pt-3 text-xs text-[#7B6656]">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#E7DFD7]">
                <Truck className="w-4 h-4 text-[#C6A15B]" />
                <span>Dispatches in 2-4 days</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#E7DFD7]">
                <ShieldCheck className="w-4 h-4 text-[#8FA57D]" />
                <span>100% Artisan Handmade</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Details Tabs */}
      <div className="bg-white rounded-3xl border border-[#E7DFD7] p-6 sm:p-10 shadow-xs">
        <div className="flex border-b border-[#E7DFD7] gap-8 overflow-x-auto pb-3">
          {[
            { id: 'description', label: 'Description' },
            { id: 'materials', label: 'Materials & Craft' },
            { id: 'care', label: 'Care Guide' },
            { id: 'shipping', label: 'Shipping & Returns' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`font-serif text-lg font-semibold pb-2 transition-colors relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#3D2E24]'
                  : 'text-[#7B6656] hover:text-[#3D2E24]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C6A15B]"
                />
              )}
            </button>
          ))}
        </div>

        <div className="pt-6 text-sm text-[#5A4335] leading-relaxed max-w-3xl">
          {activeTab === 'description' && (
            <div className="space-y-4">
              <p>{product.description}</p>
              <p>
                Each AaaS piece is created entirely by hand with precision needlework and
                patient attention to detail. No two pieces are identically alike, celebrating the
                distinctive soul of artisan crochet.
              </p>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-3">
              <p><strong>Yarn Composition:</strong> {product.material}</p>
              <p><strong>Hardware & Details:</strong> Natural bamboo, anti-tarnish antique brass, and reinforced wire structuring.</p>
              <p><strong>Sustainability:</strong> Hypoallergenic, zero synthetic microplastics, 100% biodegradable organic fibers.</p>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-3">
              <p>{product.care_instructions}</p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-[#7B6656]">
                <li>Keep dry and protect from direct prolonged moisture.</li>
                <li>To remove dust, use a soft bristle brush or hairdryer on cool setting.</li>
                <li>Do not bleach or dry clean.</li>
              </ul>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-3">
              <p>{product.shipping_information}</p>
              <p className="text-xs text-[#7B6656]">
                Orders above ₹1,499 qualify for Free Standard Delivery across India. All pieces are packed in gift-ready aesthetic presentation boxes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block mb-1">
              Verified Feedback
            </span>
            <h3 className="font-serif text-3xl font-semibold text-[#3D2E24]">
              Customer Reviews ({reviews.length})
            </h3>
          </div>
        </div>

        {/* Review Form and List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Review List */}
          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-[#E7DFD7] text-center text-xs text-[#7B6656]">
                No reviews yet. Be the first to share your experience with this handmade creation!
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-semibold text-sm text-[#3D2E24]">
                        {rev.customer_name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#8FA57D]/15 text-[#8FA57D] rounded-full font-semibold">
                        Verified Purchase
                      </span>
                    </div>
                    <div className="flex text-[#C6A15B]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#5A4335] leading-relaxed">{rev.comment}</p>
                  <p className="text-[10px] text-[#7B6656]">{formatDate(rev.created_at)}</p>
                </div>
              ))
            )}
          </div>

          {/* Submit Review Box */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E7DFD7] shadow-xs space-y-4">
            <h4 className="font-serif text-xl font-semibold text-[#3D2E24]">Write a Review</h4>
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5A4335] mb-1">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= reviewRating
                            ? 'text-[#C6A15B] fill-current'
                            : 'text-[#DDD6CF]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4335] mb-1">Your Name</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Priya M."
                  className="w-full px-3.5 py-2 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4335] mb-1">Review</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details of your experience, yarn texture, gifting reactions..."
                  className="w-full px-3.5 py-2 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full py-2.5 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
              >
                {isSubmittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-8 pt-6 border-t border-[#E7DFD7]">
          <h3 className="font-serif text-3xl font-semibold text-[#3D2E24]">You May Also Love</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
