"use client";

import React from "react";
import { TrendingUp, Calendar, Landmark, CreditCard } from "lucide-react";

interface SummaryData {
  averageOrderValue: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueThisYear: number;
}

interface RevenueSummaryProps {
  summary: SummaryData;
}

export default function RevenueSummary({ summary }: RevenueSummaryProps) {
  const cards = [
    {
      label: "Avg Order Value",
      value: summary.averageOrderValue,
      icon: CreditCard,
      color: "bg-[#722F37]/15 text-[#722F37] border-[#722F37]/30 rounded-lg",
    },
    {
      label: "Revenue This Week",
      value: summary.revenueThisWeek,
      icon: TrendingUp,
      color: "bg-[#52734D]/15 text-[#52734D] border-[#52734D]/30 rounded-lg",
    },
    {
      label: "Revenue This Month",
      value: summary.revenueThisMonth,
      icon: Calendar,
      color: "bg-[#9A681D]/15 text-[#9A681D] border-[#9A681D]/30 rounded-lg",
    },
    {
      label: "Revenue This Year",
      value: summary.revenueThisYear,
      icon: Landmark,
      color: "bg-[#541B1B]/15 text-[#541B1B] border-[#541B1B]/30 rounded-lg",
    },
  ];

  return (
    <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="border-b border-[#D9C4B0] pb-4 mb-4">
          <h3 className="font-serif text-xl font-semibold text-[#541B1B]">Financial Summary</h3>
          <p className="text-xs text-[#8B454B] font-sans mt-0.5">Aggregate atelier performance</p>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-[#F8EEE2]/60 p-3.5 border border-[#D9C4B0] rounded-xl flex flex-col justify-between gap-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] md:text-[10px] text-[#8B454B] font-medium font-sans uppercase tracking-[0.15em] block">
                    {card.label}
                  </span>
                  <div className={`p-1.5 border ${card.color}`}>
                    <Icon size={13} />
                  </div>
                </div>
                <p className="text-base md:text-xl font-serif font-bold text-[#541B1B]">
                  ₹{card.value.toLocaleString("en-IN")}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
