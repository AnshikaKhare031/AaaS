"use client";

import React from "react";

interface TrafficSource {
  name: string;
  visitors: number;
  percentage: number;
}

interface TrafficSourcesProps {
  sources: TrafficSource[] | null;
}

export default function TrafficSources({ sources }: TrafficSourcesProps) {
  const defaultSources = [
    { name: "Direct Visit", visitors: 0, percentage: 0 },
    { name: "Instagram", visitors: 0, percentage: 0 },
    { name: "WhatsApp", visitors: 0, percentage: 0 },
    { name: "Search", visitors: 0, percentage: 0 },
    { name: "Referral", visitors: 0, percentage: 0 },
  ];

  const data = sources || defaultSources;

  return (
    <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center border-b border-[#D9C4B0] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#541B1B]">Acquisition Channels</h3>
            <p className="text-xs text-[#8B454B] font-sans mt-0.5">Top referrer sites and avenues</p>
          </div>
          {!sources && (
            <span className="text-[8px] bg-[#F8EEE2] border border-[#D9C4B0] text-[#8B454B] px-2.5 py-0.5 rounded-full font-sans uppercase font-medium">
              Coming Soon
            </span>
          )}
        </div>

        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-sans">
                <span className="font-medium text-[#541B1B]">{item.name}</span>
                <span className="text-[#8B454B] font-medium text-[11px]">
                  {sources ? `${item.visitors.toLocaleString()} (${item.percentage}%)` : "Pending"}
                </span>
              </div>
              <div className="w-full bg-[#D9C4B0]/40 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#722F37] rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
