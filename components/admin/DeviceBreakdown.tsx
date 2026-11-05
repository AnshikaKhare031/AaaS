"use client";

import React from "react";
import { Laptop, Smartphone, Tablet } from "lucide-react";

interface DeviceItem {
  type: string;
  percentage: number;
}

interface DeviceBreakdownProps {
  devices: DeviceItem[] | null;
}

export default function DeviceBreakdown({ devices }: DeviceBreakdownProps) {
  const defaultDevices = [
    { type: "Mobile", percentage: 0 },
    { type: "Desktop", percentage: 0 },
    { type: "Tablet", percentage: 0 },
  ];

  const data = devices || defaultDevices;

  const getIcon = (type: string) => {
    switch (type) {
      case "Desktop":
        return Laptop;
      case "Mobile":
        return Smartphone;
      default:
        return Tablet;
    }
  };

  return (
    <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center border-b border-[#D9C4B0] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#541B1B]">Device Breakdown</h3>
            <p className="text-xs text-[#8B454B] font-sans mt-0.5">Visitor platform shares</p>
          </div>
          {!devices && (
            <span className="text-[8px] bg-[#F8EEE2] border border-[#D9C4B0] text-[#8B454B] px-2.5 py-0.5 rounded-full font-sans uppercase font-medium">
              Coming Soon
            </span>
          )}
        </div>

        <div className="space-y-3">
          {data.map((item, index) => {
            const Icon = getIcon(item.type);
            return (
              <div key={index} className="flex items-center justify-between py-2 border-b border-[#D9C4B0]/40 last:border-0 last:pb-0 font-sans">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-[#F8EEE2] border border-[#D9C4B0] rounded-full flex items-center justify-center text-[#541B1B]">
                    <Icon size={13} />
                  </div>
                  <span className="text-xs font-medium text-[#541B1B]">{item.type}</span>
                </div>
                <span className="text-xs font-semibold text-[#541B1B]">
                  {devices ? `${item.percentage}%` : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
