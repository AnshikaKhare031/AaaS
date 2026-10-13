"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

interface CategoryCardProps {
  title: string;
  description: string;
  imageSrc?: string;
  href: string;
}

export default function CategoryCard({
  title,
  description,
  imageSrc,
  href,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-3 sm:p-4 hover:border-[#EC8D99]/80 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(37,56,46,0.06)] hover:-translate-y-0.5 active:translate-y-0"
    >
      {/* Category Image or Branded Motif Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#E5DACB]/50 bg-[#F8F2E7] flex items-center justify-center">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-104"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 select-none">
            <div className="w-12 h-12 rounded-full bg-[#F6C4C2]/50 text-[#25382E] flex items-center justify-center">
              <Sparkles size={20} className="text-[#25382E]" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#5C745F] font-sans">
              Artisan Collection
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Category Info */}
      <div className="pt-4 pb-2 px-1 space-y-2">
        <h3 className="font-serif text-xl sm:text-2xl tracking-tight text-[#25382E] group-hover:text-[#25382E] transition-colors duration-200 font-medium">
          {title}
        </h3>
        <p className="text-[#5C745F] text-xs sm:text-sm leading-relaxed font-light font-sans line-clamp-2">
          {description}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#25382E] pt-1 group-hover:text-[#EC8D99] transition-colors duration-200 font-sans">
          <span>Explore Collection</span>
          <ArrowRight
            size={12}
            className="transform transition-transform duration-200 group-hover:translate-x-1 text-[#EC8D99]"
          />
        </div>
      </div>
    </Link>
  );
}
