"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Palette, ShieldCheck, Gift } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Handmade with Patience",
    description: "Every item is stitched, painted, and shaped individually by hand. No two pieces are ever identical.",
  },
  {
    icon: Palette,
    title: "Unique & Limited",
    description: "Crafted in small batches with distinctive stitches and colorways to ensure your piece is truly one of a kind.",
  },
  {
    icon: ShieldCheck,
    title: "Thoughtful Materials",
    description: "We hand-select soft natural cotton yarns, sustainable wood bases, and enduring artisan finishes.",
  },
  {
    icon: Gift,
    title: "Heirloom Packaging",
    description: "Each creation arrives delicately wrapped with natural twine and an artisan handwritten note.",
  },
];

export default function WhyHandmade() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section className="py-20 md:py-28 bg-[#F8EEE2] border-b border-[#D9C4B0]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12 md:mb-16 space-y-3">
          <div className="inline-flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B58A58]" />
            <span className="text-[10px] uppercase tracking-[0.24em] font-medium text-[#8B454B] font-sans">
              Artisan Philosophy
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#541B1B]">
            Why Choose Handmade?
          </h2>
          <p className="text-[#3B241C] font-sans font-light leading-relaxed text-sm sm:text-base opacity-85">
            Handcrafted pieces carry an intangible warmth and quiet luxury that mass-produced items can never replicate.
          </p>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-[#FFF9F2] border border-[#D9C4B0] p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:border-[#722F37]/60 hover:shadow-[0_8px_24px_rgba(84,27,27,0.06)] hover:-translate-y-0.5 group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#EBCDB8]/40 border border-[#EBCDB8]/70 flex items-center justify-center mb-5 text-[#541B1B] group-hover:bg-[#541B1B] group-hover:text-[#FFF9F2] group-hover:border-[#541B1B] transition-colors duration-300">
                  <Icon size={19} />
                </div>
                <h3 className="font-serif text-xl tracking-wide text-[#541B1B] mb-2 font-medium">
                  {feature.title}
                </h3>
                <p className="text-[#3B241C] text-xs sm:text-sm leading-relaxed font-sans font-light opacity-80">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
