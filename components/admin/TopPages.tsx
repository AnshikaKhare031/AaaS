"use client";

import React from "react";
import { Globe } from "lucide-react";

interface PageView {
  path: string;
  views: number;
}

interface TopPagesProps {
  pages: PageView[] | null;
}

export default function TopPages({ pages }: TopPagesProps) {
  return (
    <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center border-b border-[#D9C4B0] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#541B1B]">Top Visited Routes</h3>
            <p className="text-xs text-[#8B454B] font-sans mt-0.5">Most explored boutique paths</p>
          </div>
          {!pages && (
            <span className="text-[8px] bg-[#F8EEE2] border border-[#D9C4B0] text-[#8B454B] px-2.5 py-0.5 rounded-full font-sans uppercase font-medium">
              Coming Soon
            </span>
          )}
        </div>

        <div className="divide-y divide-[#D9C4B0]/50 pr-1">
          {!pages ? (
            <div className="py-8 text-center text-[#8B454B] font-sans text-xs font-light">
              Page tracking views unavailable.
            </div>
          ) : (
            pages.map((item, index) => (
              <div key={index} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 font-sans">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 bg-[#F8EEE2] border border-[#D9C4B0] rounded-full flex items-center justify-center text-[#541B1B] shrink-0">
                    <Globe size={13} />
                  </div>
                  <span className="text-xs font-mono text-[#541B1B] truncate max-w-[160px]">{item.path}</span>
                </div>
                <span className="text-xs font-semibold text-[#541B1B]">
                  {item.views.toLocaleString()} views
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
