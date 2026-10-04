"use client";

import React from "react";

interface CategorySalesPoint {
  category: string;
  revenue: number;
  percentage: number;
}

interface CategoryPerformanceProps {
  categories: CategorySalesPoint[];
}

export default function CategoryPerformance({ categories }: CategoryPerformanceProps) {
  const getBarColor = (name: string) => {
    switch (name) {
      case "Crochet":
        return "bg-[#25382E]";
      case "MDF Boards":
        return "bg-[#405F4C]";
      case "Pouches":
        return "bg-[#EC8D99]";
      case "Magnets":
        return "bg-[#5C745F]";
      case "Rakhis":
        return "bg-[#F5C842]";
      default:
        return "bg-[#F6C4C2]";
    }
  };

  return (
    <div className="bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center border-b border-[#E5DACB] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#25382E]">Collection Share</h3>
            <p className="text-xs text-[#5C745F] font-sans mt-0.5">Revenue breakdown by product line</p>
          </div>
        </div>

        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="py-8 text-center text-[#5C745F] font-sans text-xs font-light">
              No collection sales registered yet.
            </div>
          ) : (
            categories.map((item, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="font-medium text-[#25382E]">{item.category}</span>
                  <div className="space-x-1.5">
                    <span className="font-semibold text-[#25382E]">₹{item.revenue.toLocaleString("en-IN")}</span>
                    <span className="text-[#5C745F]">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-[#E5DACB]/50 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(item.category)}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
