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
    <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center border-b border-[#D9C4B0] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#541B1B]">Patron Geography</h3>
            <p className="text-xs text-[#8B454B] font-sans mt-0.5">Top visitor regions and locales</p>
          </div>
          {!countries && (
            <span className="text-[8px] bg-[#F8EEE2] border border-[#D9C4B0] text-[#8B454B] px-2.5 py-0.5 rounded-full font-sans uppercase font-medium">
              Coming Soon
            </span>
          )}
        </div>

        <div className="divide-y divide-[#D9C4B0]/50 pr-1">
          {!countries ? (
            <div className="py-8 text-center text-[#8B454B] font-sans text-xs font-light">
              Geographic analytics unavailable.
            </div>
          ) : (
            countries.map((item, index) => (
              <div key={index} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 font-sans">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 bg-[#F8EEE2] border border-[#D9C4B0] rounded-full flex items-center justify-center text-[#541B1B] shrink-0">
                    <Map size={13} />
                  </div>
                  <span className="text-xs font-medium text-[#541B1B]">{item.country}</span>
                </div>
                <span className="text-xs font-semibold text-[#541B1B]">
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
