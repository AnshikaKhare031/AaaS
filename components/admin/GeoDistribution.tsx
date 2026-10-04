"use client";

import React from "react";
import { Map } from "lucide-react";

interface CountryVisitor {
  country: string;
  visitors: number;
}

interface GeoDistributionProps {
  countries: CountryVisitor[] | null;
}

export default function GeoDistribution({ countries }: GeoDistributionProps) {
  return (
    <div className="bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center border-b border-[#E5DACB] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#25382E]">Patron Geography</h3>
            <p className="text-xs text-[#5C745F] font-sans mt-0.5">Top visitor regions and locales</p>
          </div>
          {!countries && (
            <span className="text-[8px] bg-[#F8F2E7] border border-[#E5DACB] text-[#5C745F] px-2.5 py-0.5 rounded-full font-sans uppercase font-medium">
              Coming Soon
            </span>
          )}
        </div>

        <div className="divide-y divide-[#E5DACB]/50 pr-1">
          {!countries ? (
            <div className="py-8 text-center text-[#5C745F] font-sans text-xs font-light">
              Geographic analytics unavailable.
            </div>
          ) : (
            countries.map((item, index) => (
              <div key={index} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 font-sans">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 bg-[#F8F2E7] border border-[#E5DACB] rounded-full flex items-center justify-center text-[#5C745F] shrink-0">
                    <Map size={13} />
                  </div>
                  <span className="text-xs font-medium text-[#25382E]">{item.country}</span>
                </div>
                <span className="text-xs font-semibold text-[#25382E]">
                  {item.visitors.toLocaleString()} visitors
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
