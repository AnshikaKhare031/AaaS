"use client";

import React from "react";

interface BestProduct {
  name: string;
  quantity: number;
  revenue: number;
  category: string;
}

interface BestSellingProductsProps {
  products: BestProduct[];
}

export default function BestSellingProducts({ products }: BestSellingProductsProps) {
  return (
    <div className="bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center border-b border-[#E5DACB] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#25382E]">Signature Creations</h3>
            <p className="text-xs text-[#5C745F] font-sans mt-0.5">Top 5 pieces ranked by orders</p>
          </div>
        </div>

        <div className="divide-y divide-[#E5DACB]/50 pr-1">
          {products.length === 0 ? (
            <div className="py-8 text-center text-[#5C745F] font-sans text-xs font-light">
              No product sales registered yet.
            </div>
          ) : (
            products.map((item, index) => (
              <div key={index} className="py-3 flex items-center justify-between gap-4 first:pt-0">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-[#F8F2E7] border border-[#E5DACB] text-[#25382E] w-4.5 h-4.5 rounded flex items-center justify-center font-medium font-sans">
                      {index + 1}
                    </span>
                    <p className="font-medium text-[#25382E] text-xs font-sans truncate max-w-[170px]">
                      {item.name}
                    </p>
                  </div>
                  <span className="capitalize text-[8px] tracking-[0.15em] font-medium px-2 py-0.5 bg-[#F8F2E7] border border-[#E5DACB] rounded-full text-[#5C745F] ml-6.5 inline-block uppercase">
                    {item.category === "mdf" ? "MDF Art" : item.category === "pouch" ? "Pouch" : item.category === "rakhis" ? "Rakhi" : item.category === "crochet" ? "Crochet" : "Magnet"}
                  </span>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-xs font-semibold text-[#25382E] font-sans">
                    ₹{item.revenue.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[9px] text-[#5C745F] font-sans">
                    {item.quantity} {item.quantity === 1 ? "piece" : "pieces"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
