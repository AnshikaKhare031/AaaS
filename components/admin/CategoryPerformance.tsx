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
      case "Handbags":
        return "bg-[#541B1B]";
      case "Keychains":
        return "bg-[#722F37]";
      case "Accessories":
        return "bg-[#B58A58]";
      case "Crochet":
        return "bg-[#541B1B]";
      case "MDF Boards":
        return "bg-[#8B454B]";
      case "Pouches":
        return "bg-[#D99B8A]";
      case "Magnets":
        return "bg-[#EBCDB8]";
      case "Rakhis":
        return "bg-[#9A681D]";
      default:
        return "bg-[#541B1B]";
    }
  };

  return (
    <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center border-b border-[#D9C4B0] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#541B1B]">Collection Share</h3>
            <p className="text-xs text-[#8B454B] font-sans mt-0.5">Revenue breakdown by product line</p>
          </div>
        </div>

        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="py-8 text-center text-[#8B454B] font-sans text-xs font-light">
              No collection sales registered yet.
            </div>
          ) : (
            categories.map((item, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="font-medium text-[#541B1B]">{item.category}</span>
                  <div className="space-x-1.5">
                    <span className="font-semibold text-[#541B1B]">₹{item.revenue.toLocaleString("en-IN")}</span>
                    <span className="text-[#8B454B]">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-[#D9C4B0]/40 h-1.5 rounded-full overflow-hidden">
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
