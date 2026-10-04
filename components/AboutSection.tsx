"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AboutSection() {
  const textVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.97 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] as const, delay: 0.15 },
    },
  };

  return (
    <section id="about" className="py-20 md:py-32 bg-[#405F4C] text-[#FFFAF1] overflow-hidden border-t border-b border-[#25382E]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 items-center">
        
        {/* Left Column: Editorial Story */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={textVariants}
          className="lg:col-span-6 flex flex-col justify-center space-y-6"
        >
          {/* Section label */}
          <div className="inline-flex items-center gap-2 border border-[#F6C4C2]/40 bg-[#25382E]/40 px-3.5 py-1.5 rounded-full w-fit">
            <span className="text-[#F5C842] text-xs">✦</span>
            <span className="text-[10px] uppercase tracking-[0.24em] font-medium text-[#F6C4C2] font-sans">
              Made by hands, not machines
            </span>
          </div>
          
          {/* Main Editorial Headline */}
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#FFFAF1] leading-[1.12]">
            MADE SLOWLY. <br />
            <span className="italic font-normal text-[#F6C4C2]">
              MADE BEAUTIFULLY.
            </span>
          </h2>
          
          <div className="space-y-4 text-[#FFFAF1]/85 font-sans font-light leading-relaxed text-sm sm:text-base">
            <p className="font-serif text-lg sm:text-xl text-[#F6C4C2] italic font-normal leading-relaxed">
              &ldquo;I&apos;m a homemaker, a mother, and an artist pursuing a dream that patiently waited for many years.&rdquo;
            </p>
            <p>
              Like many women, I chose to put my creative dreams on hold to devote myself entirely to my family. Every moment was dedicated to their happiness, while my love for handcrafted art quietly remained in my heart.
            </p>
            <p>
              Today, as my son begins his own independent journey, I&apos;ve found the courage to begin mine.
            </p>
            <p>
              Every crochet piece, fabric pouch, and hand-painted plaque you see here is created with love, patience, and mindful intention. To me, art is more than decoration—it&apos;s a celebration of quiet luxury, human creativity, and new beginnings.
            </p>
            <p>
              Thank you for being part of this journey and welcoming handmade craft into your everyday life.
            </p>
            <div className="pt-2">
              <p className="font-serif text-base text-[#F6C4C2] italic font-medium">With love & gratitude,</p>
              <p className="text-xs uppercase tracking-[0.2em] text-[#FFFAF1]/70 font-sans mt-0.5">AaaS Handcrafted Studio</p>
            </div>
          </div>

          {/* Key metrics */}
          <div className="pt-6 grid grid-cols-2 gap-6 border-t border-[#F6C4C2]/30">
            <div>
              <span className="font-serif text-3xl sm:text-4xl font-light text-[#FFFAF1]">100%</span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#F6C4C2] font-sans mt-1">Handmade & Unique</p>
            </div>
            <div>
              <span className="font-serif text-3xl sm:text-4xl font-light text-[#F5C842]">Intention</span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#F6C4C2] font-sans mt-1">In Every Stitch</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Artisan Process Imagery */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={imageVariants}
          className="lg:col-span-6 relative"
        >
          <div className="relative h-[380px] sm:h-[480px] rounded-3xl overflow-hidden shadow-[0_16px_48px_rgba(37,56,46,0.25)] border border-[#F6C4C2]/30 bg-[#25382E] group">
            <Image
              src="https://buswdznodxyugbipflnc.supabase.co/storage/v1/object/public/product-images/1783101248638_ChatGPT_Image_Jul_3__2026__11_23_30_PM.png"
              alt="Artisan handcrafting with intention"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-103"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Subtle soft vignette */}
            <div className="absolute inset-0 bg-radial from-transparent to-[#25382E]/30 pointer-events-none" />
          </div>
          
          {/* Minimal botanical accent frame */}
          <div className="absolute -bottom-5 -left-5 w-28 h-28 border-b border-l border-[#F6C4C2]/50 rounded-bl-3xl pointer-events-none hidden sm:block" />
          <div className="absolute -top-5 -right-5 w-28 h-28 border-t border-r border-[#F5C842]/50 rounded-tr-3xl pointer-events-none hidden sm:block" />
        </motion.div>

      </div>
    </section>
  );
}
