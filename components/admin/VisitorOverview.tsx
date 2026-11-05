"use client";

import React from "react";
import { Eye, Users, MousePointer } from "lucide-react";

interface TrafficData {
  visitorsToday: number | null;
  pageViewsToday: number | null;
  uniqueVisitors: number | null;
  bounceRate: number | null;
  averageSessionDuration: number | null;
}

interface VisitorOverviewProps {
  traffic: TrafficData | null;
}

export default function VisitorOverview({ traffic }: VisitorOverviewProps) {
  const visitorsToday = traffic?.visitorsToday ?? "Tracking Soon";
  const pageViews = traffic?.pageViewsToday ?? "Tracking Soon";
  const uniqueVisitors = traffic?.uniqueVisitors ?? "Tracking Soon";

  const cards = [
    {
      label: "Visitors Today",
      value: visitorsToday,
      icon: Users,
      color: "bg-[#722F37]/15 text-[#722F37] border-[#722F37]/30 rounded-xl",
    },
    {
      label: "Page Views Today",
      value: pageViews,
      icon: Eye,
      color: "bg-[#52734D]/15 text-[#52734D] border-[#52734D]/30 rounded-xl",
    },
    {
      label: "Unique Visitors",
      value: uniqueVisitors,
      icon: MousePointer,
      color: "bg-[#9A681D]/15 text-[#9A681D] border-[#9A681D]/30 rounded-xl",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isString = typeof card.value === "string";
        return (
          <div
            key={idx}
            className="bg-[#FFF9F2] p-4 md:p-6 border border-[#D9C4B0] rounded-2xl shadow-xs flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[9px] md:text-[10px] text-[#8B454B] font-medium font-sans uppercase tracking-[0.15em] block">
                {card.label}
              </span>
              <p className={`font-serif font-semibold ${isString ? "text-xs text-[#8B454B] uppercase tracking-[0.15em]" : "text-xl md:text-3xl text-[#541B1B]"}`}>
                {card.value}
              </p>
            </div>
            <div className={`p-2 md:p-2.5 border ${card.color} shrink-0`}>
              <Icon size={16} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
