import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SlidersHorizontal,
  Search,
  RotateCcw,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ProductCard } from '../../components/products/ProductCard';
import { Product, Category } from '../../types';
import { getProducts, getCategories } from '../../services/api';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);
        setProducts(prodRes.products || []);
        setCategories(catRes || []);
      } catch (err) {
        console.error('Error fetching shop data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync URL query params with state
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    const search = searchParams.get('search');
    if (search) setSearchQuery(search);
  }, [searchParams]);

  // Handle category change
  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    if (slug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'all') {
          if (p.category?.slug !== selectedCategory) return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q);
          const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchTags) return false;
        }
        // In Stock filter
        if (inStockOnly && p.stock_quantity <= 0) return false;
        // Price filter
        const price = p.sale_price ?? p.price;
        if (price < priceRange[0] || price > priceRange[1]) return false;

        return true;
      })
      .sort((a, b) => {
        const priceA = a.sale_price ?? a.price;
        const priceB = b.sale_price ?? b.price;

        switch (sortBy) {
          case 'newest':
            return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
          case 'price_asc':
            return priceA - priceB;
          case 'price_desc':
            return priceB - priceA;
          case 'bestselling':
            return (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0);
          case 'featured':
          default:
            return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        }
      });
  }, [products, selectedCategory, searchQuery, inStockOnly, priceRange, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('featured');
    setInStockOnly(false);
    setPriceRange([0, 3000]);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] mb-2 block">
          Artisanal Catalog
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#3D2E24] mb-3">
          Shop Handmade
        </h1>
        <p className="text-sm sm:text-base text-[#7B6656] leading-relaxed">
          Thoughtfully crafted crochet pieces for everyday moments and special occasions.
        </p>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        <button
          onClick={() => handleCategoryChange('all')}
          className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-[#5A4335] text-white shadow-xs'
              : 'bg-white border border-[#E7DFD7] text-[#5A4335] hover:bg-[#EADCCF]/40'
          }`}
        >
          All Pieces ({products.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.slug)}
            className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
              selectedCategory === cat.slug
                ? 'bg-[#5A4335] text-white shadow-xs'
                : 'bg-white border border-[#E7DFD7] text-[#5A4335] hover:bg-[#EADCCF]/40'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E7DFD7] shadow-2xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#7B6656] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search piece name or tag..."
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] placeholder-[#7B6656]/60 focus:outline-none focus:border-[#C6A15B]"
          />
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* In Stock toggle */}
          <label className="flex items-center gap-2 text-xs text-[#5A4335] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-[#E7DFD7] text-[#5A4335] focus:ring-[#C6A15B]"
            />
            <span>In Stock Only</span>
          </label>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl px-4 py-2 pr-8 text-xs font-semibold text-[#5A4335] focus:outline-none focus:border-[#C6A15B] cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="bestselling">Sort: Best Selling</option>
              <option value="newest">Sort: Newest Drops</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#7B6656] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {(searchQuery || selectedCategory !== 'all' || inStockOnly) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs text-[#C96A6A] hover:bg-[#C96A6A]/10 rounded-xl transition-colors flex items-center gap-1 font-medium"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Product Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E7DFD7] p-4 h-80 animate-pulse flex flex-col justify-between"
            >
              <div className="bg-[#EADCCF]/40 aspect-square rounded-xl w-full" />
              <div className="space-y-2 mt-4">
                <div className="bg-[#EADCCF]/40 h-4 w-3/4 rounded-md" />
                <div className="bg-[#EADCCF]/40 h-3 w-1/2 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E7DFD7] p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#EADCCF]/50 flex items-center justify-center text-[#7B6656] mx-auto mb-4">
            <Sparkles className="w-8 h-8 opacity-60 text-[#C6A15B]" />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-[#3D2E24] mb-2">
            No handmade pieces found
          </h3>
          <p className="text-xs text-[#7B6656] mb-6 leading-relaxed">
            We couldn't find any products matching your current filters. Try resetting your search or exploring other categories.
          </p>
          <button
            onClick={resetFilters}
            className="px-6 py-2.5 bg-[#5A4335] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] transition-colors"
          >
            Show All Products
          </button>
        </div>
      )}
    </div>
  );
};
