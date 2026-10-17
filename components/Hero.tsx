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
          {/* Eyebrow Pill */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 border border-[#E5DACB] bg-[#FFFAF1] px-3.5 py-1.5 rounded-full w-fit mb-6 shadow-2xs"
          >
            <span className="text-[#F5C842] text-xs">✦</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#5C745F] font-sans">
              HANDMADE CROCHET STUDIO • NEW COLLECTION
            </span>
          </motion.div>

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

            {/* Secondary CTA */}
            <Link
              href="/custom-order"
              className="px-7 py-3.5 sm:px-8 sm:py-4 border border-[#25382E] bg-transparent hover:bg-[#25382E] hover:text-[#FFFAF1] text-[#25382E] rounded-full font-sans font-medium uppercase tracking-[0.16em] text-xs transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>CUSTOM COMMISSIONS</span>
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
            <div className="flex items-center gap-2 hidden sm:flex">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C842]" />
              <span className="tracking-wide">Bespoke Orders</span>
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
                      className="relative w-full h-full flex items-center justify-center"
                    >
                      <Image
                        src={activeProduct.image_url}
                        alt={activeProduct.name || activeProduct.title || "Handcrafted Product"}
                        fill
                        className="object-contain object-center w-full h-full p-2.5 sm:p-4 transition-all duration-500"
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

                {/* Top Slide Navigation Indicators - only if multiple products */}
                {products.length > 1 && (
                  <div className="absolute top-5 right-5 z-20 flex gap-1.5 bg-[#FFFAF1]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E5DACB]/70">
                    {products.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`transition-all duration-300 rounded-full cursor-pointer ${
                          activeIndex === i
                            ? "w-4 h-1.5 bg-[#25382E]"
                            : "w-1.5 h-1.5 bg-[#E5DACB] hover:bg-[#5C745F]"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Floating Blush Pink Circular Seal (Bottom Left) */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.3 }}
                className="absolute -left-3 sm:-left-6 bottom-8 z-30 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#F6C4C2] text-[#25382E] border-4 border-[#FFFAF1] shadow-[0_12px_28px_rgba(37,56,46,0.14)] flex flex-col items-center justify-center p-2 text-center select-none"
              >
                <span className="text-[#F5C842] text-xs">✦</span>
                <span className="text-[9px] sm:text-[10px] font-sans font-semibold uppercase tracking-[0.18em] leading-tight text-[#25382E]">
                  Slow Made
                </span>
                <span className="text-[8px] font-sans text-[#25382E]/80 tracking-widest mt-0.5">
                  100% ARTISAN
                </span>
              </motion.div>

              {/* Floating Product Price Tag (Bottom Right) - only if active product exists */}
              {activeProduct && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="absolute -right-2 sm:-right-4 bottom-5 z-30 bg-[#FFFAF1]/95 backdrop-blur-md border border-[#E5DACB] rounded-2xl py-2.5 px-3.5 sm:px-4 shadow-[0_12px_32px_rgba(37,56,46,0.12)] flex items-center gap-3 max-w-[240px] sm:max-w-[280px]"
                >
                  <div className="w-2 h-2 rounded-full bg-[#EC8D99] shrink-0 animate-pulse" />
                  <div className="text-left min-w-0">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-[#5C745F] font-medium font-sans">
                      {activeProduct.category || "Handmade"}
                    </p>
                    <p className="font-serif text-xs sm:text-sm text-[#25382E] font-medium leading-tight truncate">
                      {activeProduct.name || activeProduct.title || "Handcrafted Creation"}
                    </p>
                    <p className="font-sans text-xs text-[#25382E] font-semibold mt-0.5">
                      ₹{activeProduct.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <Link
                    href={`/product/${activeProduct.id}`}
                    className="w-7 h-7 rounded-full bg-[#F6C4C2]/60 hover:bg-[#25382E] text-[#25382E] hover:text-[#FFFAF1] flex items-center justify-center transition-colors shrink-0 ml-1"
                    aria-label={`View ${activeProduct.name || activeProduct.title || "Product"}`}
                  >
                    <ArrowRight size={13} />
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
