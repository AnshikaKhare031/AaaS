"use client";

import React from "react";
import { Clock } from "lucide-react";

interface AnalyticsTimestampProps {
  timestamp: string;
}

export default function AnalyticsTimestamp({ timestamp }: AnalyticsTimestampProps) {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-[#5C745F] font-sans font-light">
      <Clock size={12} className="text-[#EC8D99]" />
      <span>Last Synchronized: {formatTime(timestamp)}</span>
    </div>
  );
}
