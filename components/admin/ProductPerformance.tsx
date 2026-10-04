"use client";

import React from "react";

interface ProductPerf {
  productId: string;
  name: string;
  views: number | null;
  orders: number;
  revenue: number;
  conversion: number | null;
  lastPurchased: string | null;
}

interface ProductPerformanceProps {
  products: ProductPerf[];
}

export default function ProductPerformance({ products }: ProductPerformanceProps) {
  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Never";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-6 shadow-xs space-y-4">
      <div className="border-b border-[#E5DACB] pb-4">
        <h3 className="font-serif text-lg font-semibold text-[#25382E]">Creation Engagement</h3>
        <p className="text-xs text-[#5C745F] font-sans mt-0.5">Interaction and order funnel metrics per piece</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E5DACB]">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-[#F8F2E7] border-b border-[#E5DACB] text-[9px] uppercase tracking-[0.15em] text-[#5C745F] font-medium">
              <th className="py-3 px-4">Creation Name</th>
              <th className="py-3 px-4 text-center">Views</th>
              <th className="py-3 px-4 text-center">Orders</th>
              <th className="py-3 px-4 text-right">Revenue</th>
              <th className="py-3 px-4 text-center">Conversion</th>
              <th className="py-3 px-4 text-right">Last Acquired</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5DACB]/50 text-[#25382E]">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#5C745F] font-light text-xs">
                  No product data compiled yet.
                </td>
              </tr>
            ) : (
              products.map((item) => (
                <tr key={item.productId} className="hover:bg-[#F8F2E7]/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#25382E] max-w-[200px] truncate">
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-center text-[#5C745F] text-[11px] uppercase tracking-wider">
                    {item.views !== null ? item.views.toLocaleString() : "Tracking Soon"}
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-[#25382E]">
                    {item.orders}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#25382E]">
                    ₹{item.revenue.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-center text-[#5C745F] text-[11px] uppercase tracking-wider">
                    {item.conversion !== null ? `${item.conversion.toFixed(1)}%` : "Tracking Soon"}
                  </td>
                  <td className="py-3 px-4 text-right text-[#5C745F] text-xs">
                    {formatDate(item.lastPurchased)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
