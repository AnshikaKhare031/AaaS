"use client";

import React, { useState } from "react";
import Image from "next/image";

interface ProductImageProps {
  src: string;
  alt: string;
}

export default function ProductImage({ src, alt }: ProductImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative aspect-[4/5] w-full max-h-[460px] lg:max-h-[580px] rounded-3xl overflow-hidden border border-[#E5DACB] shadow-[0_12px_36px_rgba(37,56,46,0.06)] bg-[#FFFAF1] group">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        onLoad={() => setIsLoaded(true)}
        className={`object-cover transition-all duration-700 group-hover:scale-102 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-radial from-transparent to-[#25382E]/5 pointer-events-none" />
    </div>
  );
}
