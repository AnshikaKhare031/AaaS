"use client";

import React from "react";
import { motion } from "framer-motion";

const items = [
  "SLOW MADE",
  "NATURAL FIBERS",
  "ZERO-WASTE DESIGN",
  "HAND STITCHED",
  "BESPOKE COMMISSIONS",
  "TIMELESS PIECES",
  "100% ORGANIC YARN",
  "HONEST ATELIER CRAFT",
];

export default function MarqueeBanner() {
  return (
    <div className="relative w-full overflow-hidden bg-[#25382E] py-3.5 border-y border-[#405F4C]/40 select-none">
      <div className="flex w-max">
        <motion.div
          className="flex shrink-0 items-center space-x-8 sm:space-x-12 pr-8 sm:pr-12 text-[#FFFAF1] text-xs sm:text-sm font-sans tracking-[0.24em] uppercase font-medium"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: 25,
            ease: "linear",
          }}
        >
          {[...items, ...items, ...items, ...items].map((item, idx) => (
            <React.Fragment key={idx}>
              <span className="shrink-0">{item}</span>
              <span className="text-[#F5C842] shrink-0 text-xs">✦</span>
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
