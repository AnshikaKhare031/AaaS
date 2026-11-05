import React from "react";

interface PolicyLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function PolicyLayout({ title, lastUpdated, children }: PolicyLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8EEE2] pt-28 pb-16 md:pt-36 md:pb-24 font-sans text-[#3B241C]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8 animate-fadeIn">
        
        {/* Page Hero */}
        <div className="text-center bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-8 md:p-12 shadow-xs space-y-3">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#B58A58] font-medium font-sans">✦ Atelier Policies ✦</span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#541B1B]">{title}</h1>
          <p className="text-[#8B454B] text-xs font-light font-sans">Last Updated: {lastUpdated}</p>
        </div>

        {/* Content container */}
        <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 md:p-10 shadow-xs space-y-6 text-sm text-[#3B241C]/85 leading-relaxed font-light font-sans">
          {children}
        </div>

      </div>
    </div>
  );
}
