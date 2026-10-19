"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Product } from "@/types/product";
import { getActiveProducts } from "@/lib/supabase/products";
import { matchesCategory } from "@/lib/constants/categories";

interface AboutSectionProps {
  initialProducts?: Product[];
}

export default function AboutSection({ initialProducts }: AboutSectionProps) {
  const [products, setProducts] = useState<Product[]>(() => initialProducts || []);

  useEffect(() => {
    if (products.length > 0) return;

    getActiveProducts()
      .then((fetched) => {
        if (fetched && fetched.length > 0) {
          setProducts(fetched);
        }
      })
      .catch((err) => {
        console.error("AboutSection: error loading active products:", err);
      });
  }, [products.length]);

  // Select an active product from the "Handbags" category that has a valid product image
  const handbagProduct =
    products.find(
      (p) =>
        p.is_active !== false &&
        matchesCategory(p.category, "Handbags") &&
        Boolean(p.image_url && p.image_url.trim().length > 0)
    ) || null;

  const imageUrl = handbagProduct?.image_url?.trim() || null;
  const productName = handbagProduct?.name || handbagProduct?.title || "Handcrafted Crochet Handbag";
  const imageAlt = `${productName} - Handcrafted Crochet by AAAS`;

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay: 0.1 },
    },
  };

  return (
    <section id="about" className="py-16 md:py-24 bg-[#405F4C] text-[#FFFAF1] overflow-hidden border-t border-b border-[#25382E]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        {/* Left Column: Editorial Story */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={textVariants}
          className="lg:col-span-6 flex flex-col justify-center space-y-5"
        >
          {/* Main Editorial Headline */}
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#FFFAF1] leading-[1.12]">
            A LITTLE LOVE, <br />
            <span className="italic font-normal text-[#F6C4C2]">
              WOVEN INTO EVERY STITCH.
            </span>
          </h2>
          
          <div className="space-y-3.5 text-[#FFFAF1]/85 font-sans font-light leading-relaxed text-sm sm:text-[15px]">
            <p className="font-serif text-base sm:text-lg text-[#F6C4C2] italic font-normal leading-relaxed">
              &ldquo;As a homemaker and mother, crochet has always been my quiet space of joy—a thread connecting patience, care, and creativity.&rdquo;
            </p>
            <p>
              For years, my days have revolved around caring for my home and family. Amidst the busy rhythm of everyday life, holding a crochet hook and working with soft yarns became a creative interest that brought me immense calm and fulfillment.
            </p>
            <p>
              With time, I felt a deep desire to give my creativity more space—to nurture this interest into something meaningful and lasting. That gentle decision became AAAS.
            </p>
            <p>
              Crochet cannot be rushed. Every piece requires hours of patience, mindful focus, and heartfelt care. Because each stitch is made entirely by hand, no two pieces are ever identical, giving every creation its own warmth, character, and individuality.
            </p>
            <p>
              Through AAAS, I am so grateful to share these handmade crochet creations with you. When you carry one of our pieces, you hold a tangible reflection of that time, care, and love.
            </p>
            <div className="pt-1">
              <p className="font-serif text-base text-[#F6C4C2] italic font-medium">With love & gratitude,</p>
              <p className="text-xs uppercase tracking-[0.2em] text-[#FFFAF1]/70 font-sans mt-0.5">The Founder & Mother Behind AAAS</p>
            </div>
          </div>

          {/* Key metrics / highlights */}
          <div className="pt-5 grid grid-cols-2 gap-6 border-t border-[#F6C4C2]/30">
            <div>
              <span className="font-serif text-2xl sm:text-3xl font-light text-[#FFFAF1]">100%</span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#F6C4C2] font-sans mt-0.5">Handmade Crochet</p>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl font-light text-[#F5C842]">Heartfelt</span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#F6C4C2] font-sans mt-0.5">In Every Stitch</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Artisan Imagery loaded dynamically from Handbags category */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={imageVariants}
          className="lg:col-span-6 relative"
        >
          <div className="relative h-[340px] sm:h-[420px] lg:h-[480px] rounded-3xl overflow-hidden shadow-[0_16px_48px_rgba(37,56,46,0.25)] border border-[#F6C4C2]/30 bg-[#25382E] group">
            {imageUrl ? (
              <>
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-103"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                />
                {/* Subtle soft vignette */}
                <div className="absolute inset-0 bg-radial from-transparent to-[#25382E]/30 pointer-events-none" />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                <span className="text-[#F5C842] text-3xl">✦</span>
                <h3 className="font-serif text-2xl sm:text-3xl font-light text-[#FFFAF1]">
                  AAAS Crochet Atelier
                </h3>
                <p className="text-xs text-[#FFFAF1]/70 font-sans font-light max-w-xs leading-relaxed">
                  Every heirloom crochet handbag is patiently shaped by hand with patience, care, and love.
                </p>
              </div>
            )}
          </div>
          
          {/* Minimal botanical accent frame */}
          <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b border-l border-[#F6C4C2]/50 rounded-bl-3xl pointer-events-none hidden sm:block" />
          <div className="absolute -top-4 -right-4 w-24 h-24 border-t border-r border-[#F5C842]/50 rounded-tr-3xl pointer-events-none hidden sm:block" />
        </motion.div>

      </div>
    </section>
  );
}
