"use client";

import React from "react";

interface AaaSLogoProps {
  variant?: "dark" | "light" | "inverted";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function AaaSLogo({
  variant = "dark",
  size = "md",
  className = "",
}: AaaSLogoProps) {
  // Color configuration according to AaaS brand palette
  const isLight = variant === "light" || variant === "inverted";
  const primaryColor = isLight ? "#FFFAF1" : "#25382E";
  const accentColor = isLight ? "#F6C4C2" : "#EC8D99"; // Blush / Bright Pink
  const secondaryColor = isLight ? "#F6C4C2" : "#5C745F";
  const sageColor = isLight ? "#F6C4C2" : "#5C745F"; // Muted Sage

  const iconSizes = {
    sm: { width: 34, height: 34, titleClass: "text-xl", subClass: "text-[8px] tracking-[0.26em]" },
    md: { width: 44, height: 44, titleClass: "text-2xl sm:text-3xl", subClass: "text-[9px] sm:text-[10px] tracking-[0.28em]" },
    lg: { width: 56, height: 56, titleClass: "text-3xl sm:text-4xl", subClass: "text-[10px] sm:text-[11px] tracking-[0.32em]" },
  };

  const { width, height, titleClass, subClass } = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Handcrafted Emblem SVG: Two graceful hands crocheting with hook, yarn, and botanical detail */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-500 group-hover:scale-105"
        aria-hidden="true"
      >
        {/* Subtle decorative gold circle ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke={accentColor}
          strokeWidth="1.2"
          strokeDasharray="3 3"
          opacity="0.45"
        />

        {/* Minimal Botanical Sprig detail */}
        <path
          d="M26 66C29 59 34 56 42 54"
          stroke={sageColor}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M28 62C27 59 28 56 31 55C33 58 32 61 28 62Z"
          fill={sageColor}
          opacity="0.75"
        />
        <path
          d="M34 58C34 55 36 53 39 53C40 56 38 58 34 58Z"
          fill={sageColor}
          opacity="0.75"
        />

        {/* Flowing yarn loop */}
        <path
          d="M24 48C24 40 32 32 44 32C58 32 62 44 54 52C48 58 40 54 44 46C48 38 60 36 68 44C74 50 72 62 60 68C48 74 36 68 34 60"
          stroke={accentColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Left hand holding workpiece */}
        <path
          d="M22 62C26 60 31 57 36 51C38 48 41 46 44 48C46 50 44 54 41 57C37 62 31 67 25 69"
          stroke={primaryColor}
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        {/* Crochet Hook (angled gracefully) */}
        <line
          x1="68"
          y1="28"
          x2="45"
          y2="53"
          stroke={accentColor}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Crochet Hook tip catch */}
        <path
          d="M45 53C43.5 54.5 42 53.5 43 51"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Right hand guiding the hook */}
        <path
          d="M74 36C70 38 66 41 62 45C60 47 58 47 59 44C61 40 65 35 70 31C74 27 78 28 77 32C76 35 74 35 74 36Z"
          stroke={primaryColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Soft stitch details */}
        <circle cx="50" cy="50" r="1.5" fill={accentColor} />
        <circle cx="56" cy="46" r="1.5" fill={accentColor} />
        <circle cx="44" cy="54" r="1.5" fill={accentColor} />
      </svg>

      {/* Typography: AaaS Brand Wordmark + Subtitle */}
      <div className="flex flex-col justify-center">
        <span
          className={`font-serif tracking-tight leading-none transition-colors duration-300 ${titleClass}`}
          style={{ color: primaryColor }}
        >
          AaaS
        </span>
        <span
          className={`font-sans font-medium uppercase mt-1 leading-none ${subClass}`}
          style={{ color: secondaryColor }}
        >
          HANDMADE CROCHET
        </span>
      </div>
    </div>
  );
}
