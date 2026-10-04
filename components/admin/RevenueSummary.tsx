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
      color: "bg-[#EC8D99]/20 text-[#25382E] border-[#EC8D99]/40 rounded-lg",
    },
    {
      label: "Revenue This Week",
      value: summary.revenueThisWeek,
      icon: TrendingUp,
      color: "bg-[#405F4C]/15 text-[#405F4C] border-[#405F4C]/25 rounded-lg",
    },
    {
      label: "Revenue This Month",
      value: summary.revenueThisMonth,
      icon: Calendar,
      color: "bg-[#F5C842]/20 text-[#25382E] border-[#F5C842]/40 rounded-lg",
    },
    {
      label: "Revenue This Year",
      value: summary.revenueThisYear,
      icon: Landmark,
      color: "bg-[#5C745F]/15 text-[#25382E] border-[#5C745F]/25 rounded-lg",
    },
  ];

  return (
    <div className="bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="border-b border-[#E5DACB] pb-4 mb-4">
          <h3 className="font-serif text-xl font-semibold text-[#25382E]">Financial Summary</h3>
          <p className="text-xs text-[#5C745F] font-sans mt-0.5">Aggregate atelier performance</p>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-[#F8F2E7] p-3.5 border border-[#E5DACB] rounded-xl flex flex-col justify-between gap-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] md:text-[10px] text-[#5C745F] font-medium font-sans uppercase tracking-[0.15em] block">
                    {card.label}
                  </span>
                  <div className={`p-1.5 border ${card.color}`}>
                    <Icon size={13} />
                  </div>
                </div>
                <p className="text-base md:text-xl font-serif font-bold text-[#25382E]">
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
