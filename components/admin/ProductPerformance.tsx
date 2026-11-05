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
    <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 shadow-xs space-y-4">
      <div className="border-b border-[#D9C4B0] pb-4">
        <h3 className="font-serif text-lg font-semibold text-[#541B1B]">Creation Engagement</h3>
        <p className="text-xs text-[#8B454B] font-sans mt-0.5">Interaction and order funnel metrics per piece</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#D9C4B0]">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-[#F8EEE2] border-b border-[#D9C4B0] text-[9px] uppercase tracking-[0.15em] text-[#8B454B] font-medium">
              <th className="py-3 px-4">Creation Name</th>
              <th className="py-3 px-4 text-center">Views</th>
              <th className="py-3 px-4 text-center">Orders</th>
              <th className="py-3 px-4 text-right">Revenue</th>
              <th className="py-3 px-4 text-center">Conversion</th>
              <th className="py-3 px-4 text-right">Last Acquired</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9C4B0]/50 text-[#3B241C]">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#8B454B] font-light text-xs">
                  No product data compiled yet.
                </td>
              </tr>
            ) : (
              products.map((item) => (
                <tr key={item.productId} className="hover:bg-[#F8EEE2]/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#541B1B] max-w-[200px] truncate">
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-center text-[#8B454B] text-[11px] uppercase tracking-wider">
                    {item.views !== null ? item.views.toLocaleString() : "Tracking Soon"}
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-[#541B1B]">
                    {item.orders}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#541B1B]">
                    ₹{item.revenue.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-center text-[#8B454B] text-[11px] uppercase tracking-wider">
                    {item.conversion !== null ? `${item.conversion.toFixed(1)}%` : "Tracking Soon"}
                  </td>
                  <td className="py-3 px-4 text-right text-[#3B241C]/80 text-xs">
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
