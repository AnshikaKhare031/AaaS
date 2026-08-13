import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Tag, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { getProducts } from '../../services/api';
import { formatPrice } from '../../utils/helpers';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const POPULAR_TAGS = ['Tulip', 'Handbag', 'Coasters', 'Daisy', 'Keychain', 'Bespoke'];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await getProducts({ search: query.trim(), limit: 6 });
        setResults(res.products || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectProduct = (slug: string) => {
    onClose();
    navigate(`/product/${slug}`);
  };

  const handleSearchAll = (searchTerm: string) => {
    onClose();
    navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E7DFD7] overflow-hidden z-10"
          >
            {/* Input Bar */}
            <div className="p-4 sm:p-5 border-b border-[#E7DFD7] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#C6A15B] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search handmade bouquets, handbags, accessories..."
                className="w-full bg-transparent text-[#3D2E24] placeholder-[#7B6656]/50 text-base sm:text-lg font-sans focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-[#7B6656] hover:text-[#3D2E24] rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="px-2.5 py-1 text-xs text-[#7B6656] hover:text-[#3D2E24] bg-[#F8F5F0] rounded-lg font-medium"
              >
                ESC
              </button>
            </div>

            {/* Popular suggestions if query is empty */}
            {!query && (
              <div className="p-6 bg-[#F8F5F0]/50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7B6656] uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" /> Popular Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleSearchAll(tag)}
                      className="px-3.5 py-1.5 bg-white border border-[#E7DFD7] text-xs font-medium text-[#5A4335] rounded-full hover:border-[#C6A15B] hover:text-[#3D2E24] transition-colors flex items-center gap-1.5"
                    >
                      <Tag className="w-3 h-3 text-[#C6A15B]" /> {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {query && (
              <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="py-12 text-center text-sm text-[#7B6656]">
                    Searching handmade catalog...
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-[#7B6656] font-medium mb-3">
                      Found {results.length} handmade matches:
                    </p>
                    {results.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product.slug)}
                        className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-[#F8F5F0] cursor-pointer transition-colors border border-transparent hover:border-[#E7DFD7] group"
                      >
                        <img
                          src={product.images?.[0]?.image_url || '/images/tulip_bouquet.jpg'}
                          alt={product.name}
                          className="w-14 h-14 rounded-lg object-cover bg-[#F8F5F0] flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-base font-semibold text-[#3D2E24] group-hover:text-[#C6A15B] transition-colors truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-[#7B6656] truncate">{product.category?.name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-bold text-[#5A4335]">
                            {formatPrice(product.sale_price ?? product.price)}
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t border-[#E7DFD7] text-center">
                      <button
                        onClick={() => handleSearchAll(query)}
                        className="text-xs font-semibold text-[#5A4335] hover:text-[#C6A15B] inline-flex items-center gap-1.5 uppercase tracking-wider"
                      >
                        View all results for "{query}" <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="font-serif text-lg text-[#3D2E24] font-medium mb-1">
                      No handmade pieces found.
                    </p>
                    <p className="text-xs text-[#7B6656] mb-4">
                      Try searching with different keywords or browse our catalog.
                    </p>
                    <button
                      onClick={() => handleSearchAll('')}
                      className="px-5 py-2 bg-[#5A4335] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] transition-colors"
                    >
                      Explore All Products
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
