"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Product } from "@/types/product";
import { getActiveProducts } from "@/lib/supabase/products";

interface HeroProps {
  initialProducts?: Product[];
}

export default function Hero({ initialProducts }: HeroProps) {
  const [products, setProducts] = useState<Product[]>(() => {
    return (initialProducts || []).filter(
      (p) => p.is_active !== false && Boolean(p.image_url && p.image_url.trim().length > 0)
    );
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Fallback client-side fetch if initialProducts was not provided or empty
  useEffect(() => {
    if (products.length > 0) return;

    getActiveProducts()
      .then((fetched) => {
        const valid = (fetched || []).filter(
          (p) => p.is_active !== false && Boolean(p.image_url && p.image_url.trim().length > 0)
        );
        if (valid.length > 0) {
          setProducts(valid);
        }
      })
      .catch((err) => {
        console.error("Hero: error loading active products:", err);
      });
  }, [products.length]);

  // Rotate slides automatically if there are multiple products
  useEffect(() => {
    if (isHovered || products.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % products.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered, products.length]);

  const activeProduct = products[activeIndex] || products[0] || null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <section className="relative min-h-[88vh] lg:min-h-[92vh] flex items-center pt-28 md:pt-36 pb-14 md:pb-20 overflow-hidden bg-[#F8F2E7]">
      {/* Subtle organic texture grid */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#E5DACB_1px,transparent_1px)] [background-size:28px_28px] opacity-45 pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center relative z-10">
        
        {/* Left Column: Editorial Brand Headline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6 flex flex-col justify-center text-left"
        >

          {/* Editorial Headline with Bright Pink Accent */}
          <motion.h1
            variants={itemVariants}
            className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-[#25382E] leading-[1.08] mb-6"
          >
            Soft things for <br />
            <span className="italic font-normal text-[#EC8D99]">
              bold hearts.
            </span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            variants={itemVariants}
            className="text-[#5C745F] text-base sm:text-lg max-w-lg leading-relaxed mb-8 sm:mb-10 font-sans font-light"
          >
            Thoughtfully designed and patiently crocheted by hand in our intimate atelier. Heirloom pieces crafted from natural organic cotton and pure wool fibers.
          </motion.p>

          {/* CTA Buttons Row */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-3.5 sm:gap-4 items-center"
          >
            {/* Primary CTA */}
            <Link
              href="#categories"
              className="group px-7 py-3.5 sm:px-8 sm:py-4 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] rounded-full font-sans font-medium uppercase tracking-[0.16em] text-xs flex items-center gap-2.5 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>SHOP THE COLLECTION</span>
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform duration-300 text-[#EC8D99]"
              />
            </Link>
          </motion.div>

          {/* Subtle Trust Indicators */}
          <motion.div
            variants={itemVariants}
            className="mt-10 pt-6 border-t border-[#E5DACB]/60 flex items-center gap-6 sm:gap-8 text-xs font-sans text-[#5C745F]"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5C745F]" />
              <span className="tracking-wide">100% Handcrafted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EC8D99]" />
              <span className="tracking-wide">Natural Organic Yarn</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Signature Arched Picture Window */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="lg:col-span-6 relative w-full flex items-center justify-center mt-6 lg:mt-0"
        >
          <div className="relative w-full max-w-[420px] sm:max-w-[460px]">
            {/* Blush Pink soft decorative glow */}
            <div className="absolute -inset-2 rounded-t-[230px] rounded-b-3xl bg-[#F6C4C2]/50 -z-10 blur-xs" />

            {/* Arched Picture Window */}
            <div className="relative rounded-t-[220px] rounded-b-2xl border-2 border-[#E5DACB] bg-[#FFFAF1] p-3.5 sm:p-5 shadow-[0_20px_50px_rgba(37,56,46,0.08)]">
              {/* Inner Arched Image Area */}
              <div className="relative aspect-[4/5] w-full rounded-t-[200px] rounded-b-xl overflow-hidden bg-[#F8F2E7] flex items-center justify-center">
                {activeProduct ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeProduct.id}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.65, ease: "easeInOut" }}
                      className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-t-[200px] rounded-b-xl"
                    >
                      <Image
                        src={activeProduct.image_url}
                        alt={activeProduct.name || activeProduct.title || "Handcrafted Product"}
                        fill
                        className="w-full h-full object-cover object-center transition-all duration-500"
                        priority={activeIndex === 0}
                        sizes="(max-width: 768px) 90vw, 45vw"
                      />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 select-none">
                    <div className="w-14 h-14 rounded-full bg-[#F6C4C2]/50 text-[#25382E] flex items-center justify-center">
                      <Sparkles size={24} className="text-[#25382E]" />
                    </div>
                    <p className="font-serif text-xl sm:text-2xl text-[#25382E] font-medium">
                      Handcrafted Atelier
                    </p>
                    <p className="text-xs text-[#5C745F] font-sans font-light max-w-xs leading-relaxed">
                      Thoughtfully made heirloom pieces crafted by hand. New additions arriving soon.
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
