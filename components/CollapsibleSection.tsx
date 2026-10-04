"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function CollapsibleSection({ title, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // On desktop, it is always open
  const showContent = !isMobile || isOpen;

  return (
    <div className="border-b border-[#E5DACB] pb-3.5 lg:pb-0 lg:border-none">
      <button
        onClick={() => isMobile && setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 lg:py-0 text-left cursor-pointer lg:cursor-default lg:pointer-events-none focus:outline-none"
        disabled={!isMobile}
      >
        <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#25382E] font-sans">
          {title}
        </h3>
        {isMobile && (
          <ChevronDown
            size={14}
            className={`text-[#5C745F] transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>
      
      {showContent && (
        <div className="pt-2 lg:pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
