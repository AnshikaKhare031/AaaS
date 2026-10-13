"use client";

import React from "react";
import { motion } from "framer-motion";
import Hero from "@/components/Hero";
import MarqueeBanner from "@/components/MarqueeBanner";
import AboutSection from "@/components/AboutSection";
import CategoryCard from "@/components/CategoryCard";
import WhyHandmade from "@/components/WhyHandmade";
import HowItWorks from "@/components/HowItWorks";
import CTASection from "@/components/CTASection";

export default function Home() {
  const categories = [
    {
      title: "Handbags",
      description: "Artisan-stitched crochet handbags, heirloom potlis, and everyday totes crafted with luxury yarn.",
      imageSrc: "https://seyqdbdvcofdvgjxsvbt.supabase.co/storage/v1/object/public/product-images/dac8dd78-product7.webp",
      href: "/category/handbags",
    },
    {
      title: "Keychains",
      description: "Delicate handcrafted floral, animal, and amigurumi charm keychains.",
      href: "/category/keychains",
    },
    {
      title: "Accessories",
      description: "Exquisite handmade lifestyle accents, pouches, and wearable crochet accessories.",
      href: "/category/accessories",
    },
  ];

  return (
    <div className="relative bg-[#F8F2E7]">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Marquee Ticker Band from Figma */}
      <MarqueeBanner />

      {/* 3. Curated Collections Section */}
      <section id="categories" className="py-20 md:py-28 bg-[#F8F2E7] scroll-mt-20 border-b border-[#E5DACB]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16 pb-6 border-b border-[#E5DACB]/60">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2">
                <span className="text-[#EC8D99] text-xs">✦</span>
                <span className="text-[10px] uppercase tracking-[0.24em] font-medium text-[#5C745F] font-sans">
                  Curated Selections
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-light tracking-tight text-[#25382E]">
                Meet your new favorites
              </h2>
            </div>
            <p className="max-w-md text-[#5C745F] font-sans font-light leading-relaxed text-sm sm:text-base">
              Thoughtfully curated pieces designed to bring warmth, texture, and quiet luxury into your daily rituals. Select any collection to explore.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {categories.map((category, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <CategoryCard {...category} />
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. About AaaS Atelier */}
      <AboutSection />

      {/* 5. Why Choose Handmade */}
      <WhyHandmade />

      {/* 6. How Ordering Works */}
      <HowItWorks />

      {/* 7. Custom Order & Contact Call-to-Action */}
      <CTASection />
    </div>
  );
}
