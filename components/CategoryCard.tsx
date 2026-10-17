"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface CategoryCardProps {
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  href: string;
  index?: number;
}

export default function CategoryCard({
  title,
  description,
  imageSrc,
  imageAlt,
  href,
  index = 0,
}: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="h-full flex flex-col"
    >
      <Link
        href={href}
        className="group flex flex-col justify-between h-full bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-3.5 sm:p-5 hover:border-[#EC8D99]/80 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(37,56,46,0.08)] hover:-translate-y-0.5 active:translate-y-0"
      >
        {/* Square Image Frame */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl shrink-0">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt || `${title} Collection`}
              fill
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-104"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2.5 select-none bg-[#F8F2E7]">
              <div className="w-14 h-14 rounded-full bg-[#F6C4C2]/50 text-[#25382E] flex items-center justify-center">
                <Sparkles size={24} className="text-[#25382E]" />
              </div>
              <p className="font-serif text-lg text-[#25382E] font-medium">
                New {title} in Progress
              </p>
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#5C745F] font-sans">
                Handcrafted in Atelier
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {/* Category Details & Balanced Typography */}
        <div className="pt-5 pb-1 px-1 flex-grow flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <h3 className="font-serif text-2xl sm:text-3xl tracking-tight text-[#25382E] group-hover:text-[#EC8D99] transition-colors duration-200 font-medium">
              {title}
            </h3>
            <p className="text-[#5C745F] text-xs sm:text-sm leading-relaxed font-light font-sans line-clamp-2 min-h-[2.5rem]">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#25382E] pt-2.5 border-t border-[#E5DACB]/50 group-hover:text-[#EC8D99] transition-colors duration-200 font-sans">
            <span>Explore Collection</span>
            <ArrowRight
              size={12}
              className="transform transition-transform duration-200 group-hover:translate-x-1 text-[#EC8D99]"
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
