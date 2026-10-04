import React from "react";

interface PolicyLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function PolicyLayout({ title, lastUpdated, children }: PolicyLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8F2E7] pt-28 pb-16 md:pt-36 md:pb-24 font-sans text-[#25382E]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8 animate-fadeIn">
        
        {/* Page Hero */}
        <div className="text-center bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-8 md:p-12 shadow-[0_2px_12px_rgba(37,56,46,0.03)] space-y-3">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#EC8D99] font-medium font-sans">✦ Atelier Policies ✦</span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#25382E]">{title}</h1>
          <p className="text-[#5C745F] text-xs font-light font-sans">Last Updated: {lastUpdated}</p>
        </div>

        {/* Content container */}
        <div className="bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-6 md:p-10 shadow-[0_2px_12px_rgba(37,56,46,0.03)] space-y-6 text-sm text-[#5C745F] leading-relaxed font-light font-sans">
          {children}
        </div>

      </div>
    </div>
  );
}
