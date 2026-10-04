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
      color: "bg-[#EC8D99]/20 text-[#25382E] border-[#EC8D99]/40 rounded-xl",
    },
    {
      label: "Page Views Today",
      value: pageViews,
      icon: Eye,
      color: "bg-[#405F4C]/15 text-[#405F4C] border-[#405F4C]/25 rounded-xl",
    },
    {
      label: "Unique Visitors",
      value: uniqueVisitors,
      icon: MousePointer,
      color: "bg-[#F5C842]/20 text-[#25382E] border-[#F5C842]/40 rounded-xl",
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
            className="bg-[#FFFAF1] p-4 md:p-6 border border-[#E5DACB] rounded-2xl shadow-xs flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[9px] md:text-[10px] text-[#5C745F] font-medium font-sans uppercase tracking-[0.15em] block">
                {card.label}
              </span>
              <p className={`font-serif font-semibold ${isString ? "text-xs text-[#5C745F] uppercase tracking-[0.15em]" : "text-xl md:text-3xl text-[#25382E]"}`}>
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
