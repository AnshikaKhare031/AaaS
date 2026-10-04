"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Heart, MessageSquare, PackageCheck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Explore the Atelier",
    description: "Browse curated crochet accessories, hand-painted plaques, and handcrafted pouches.",
  },
  {
    icon: Heart,
    title: "Select or Personalize",
    description: "Choose your favorite piece or specify tailored yarn shades and personal custom inscriptions.",
  },
  {
    icon: MessageSquare,
    title: "Direct Artisan Contact",
    description: "Reach out effortlessly through our online checkout, WhatsApp, or email with custom requests.",
  },
  {
    icon: PackageCheck,
    title: "Lovingly Delivered",
    description: "Each item is crafted by hand, carefully inspected, and shipped with personalized packaging.",
  },
];

export default function HowItWorks() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section className="py-20 md:py-32 bg-[#F8F2E7] relative overflow-hidden border-b border-[#E5DACB]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-14 md:mb-20 space-y-3">
          <div className="inline-flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EC8D99]" />
            <span className="text-[10px] uppercase tracking-[0.24em] font-medium text-[#5C745F] font-sans">
              The Artisan Process
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#25382E]">
            How Ordering Works
          </h2>
          <p className="text-[#5C745F] font-sans font-light leading-relaxed text-sm sm:text-base">
            Every creation is crafted with intention. Here is how your handmade piece comes to life.
          </p>
        </div>

        {/* Timeline Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="relative grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-8"
        >
          {/* Horizontal line for desktop timeline */}
          <div className="absolute top-[28px] left-[14%] right-[14%] h-px bg-[#E5DACB] hidden md:block z-0" aria-hidden="true" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="flex flex-col items-center text-center space-y-4 relative z-10 group"
              >
                {/* Step Icon Node */}
                <div className="w-14 h-14 rounded-full bg-[#FFFAF1] border border-[#E5DACB] flex items-center justify-center text-[#25382E] shadow-xs group-hover:border-[#EC8D99] group-hover:text-[#EC8D99] transition-all duration-300 transform group-hover:scale-105">
                  <Icon size={19} />
                </div>

                {/* Step Number Badge */}
                <span className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#25382E] bg-[#F6C4C2]/60 px-3 py-0.5 rounded-full font-sans">
                  Step 0{idx + 1}
                </span>

                {/* Step Content */}
                <div className="space-y-1.5 max-w-xs">
                  <h3 className="font-serif text-lg font-medium text-[#25382E]">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5C745F] font-sans font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
