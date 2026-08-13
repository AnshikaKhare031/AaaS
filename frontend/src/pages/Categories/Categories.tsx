import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Category } from '../../types';
import { getCategories } from '../../services/api';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] mb-2 block">
          Artisanal Catalogues
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#3D2E24] mb-3">
          Our Collections
        </h1>
        <p className="text-sm sm:text-base text-[#7B6656]">
          Discover our four distinctive realms of handmade crochet craftsmanship.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group relative rounded-3xl overflow-hidden border border-[#E7DFD7] shadow-md bg-white aspect-[16/10]"
          >
            <img
              src={cat.image_url || '/images/tulip_bouquet.jpg'}
              alt={cat.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3D2E24]/90 via-[#3D2E24]/30 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-white flex flex-col justify-end">
              <span className="text-xs uppercase font-semibold tracking-widest text-[#C6A15B] mb-1">
                Collection 0{idx + 1}
              </span>
              <h3 className="font-serif text-3xl font-semibold mb-2">{cat.name}</h3>
              <p className="text-xs sm:text-sm text-[#DDD6CF] max-w-md mb-4 leading-relaxed line-clamp-2">
                {cat.description}
              </p>
              <div>
                <Link
                  to={cat.slug === 'custom-orders' ? '/custom-orders' : `/shop?category=${cat.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#3D2E24] hover:bg-[#C6A15B] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                >
                  Explore Collection <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
