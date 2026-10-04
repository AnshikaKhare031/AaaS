"use client";

import React, { useState } from "react";

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[#7A6656] font-sans text-xs">
        No revenue data available
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1000);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  // SVG dimensions
  const width = 600;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.revenue / maxRevenue) * chartHeight;
    return { x, y, data: d };
  });

  // Construct SVG Path
  const linePath = points.reduce((path, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    return `${path} L ${p.x} ${p.y}`;
  }, "");

  // Area path closes at bottom of chart
  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : "";

  // Grid lines
  const gridLinesCount = 4;
  const gridLines = Array.from({ length: gridLinesCount }).map((_, i) => {
    const value = (maxRevenue / (gridLinesCount - 1)) * i;
    const y = paddingTop + chartHeight - (value / maxRevenue) * chartHeight;
    return { y, value };
  });

  return (
    <div className="bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex justify-between items-center border-b border-[#E5DACB] pb-4">
        <div>
          <h3 className="font-serif text-xl font-semibold text-[#25382E]">Revenue Trajectory</h3>
          <p className="text-xs text-[#5C745F] font-sans mt-0.5">Last 30 days of atelier orders</p>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase tracking-[0.15em] text-[#5C745F] font-medium font-sans">Total Volume</span>
          <p className="text-2xl font-serif font-bold text-[#25382E]">₹{totalRevenue.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto font-sans text-[10px] text-[#5C745F] select-none overflow-visible"
        >
          {/* Y Axis Grid Lines & Labels */}
          {gridLines.map((line, idx) => (
            <g key={idx} className="opacity-60">
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={width - paddingRight}
                y2={line.y}
                stroke="#E5DACB"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text x={paddingLeft - 10} y={line.y + 3} textAnchor="end" className="fill-[#5C745F] font-medium text-[9px]">
                ₹{line.value >= 1000 ? `${(line.value / 1000).toFixed(1)}k` : line.value}
              </text>
            </g>
          ))}

          {/* Area Path */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#aaas-chart-gradient)"
              className="opacity-60"
            />
          )}

          {/* Line Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#EC8D99"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Gradients */}
          <defs>
            <linearGradient id="aaas-chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EC8D99" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#EC8D99" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Interactive vertical hover line */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <g>
              <line
                x1={points[hoveredIndex].x}
                y1={paddingTop}
                x2={points[hoveredIndex].x}
                y2={paddingTop + chartHeight}
                stroke="#EC8D99"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
              <circle
                cx={points[hoveredIndex].x}
                cy={points[hoveredIndex].y}
                r={5}
                fill="#25382E"
                stroke="#FFFAF1"
                strokeWidth={2}
              />
            </g>
          )}

          {/* X Axis Labels */}
          {data.map((d, index) => {
            if (index % 5 !== 0 && index !== data.length - 1) return null;
            const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
            return (
              <text
                key={index}
                x={x}
                y={height - 15}
                textAnchor="middle"
                className="fill-[#5C745F] font-medium text-[9px]"
              >
                {d.date}
              </text>
            );
          })}

          {/* Invisible interactive hover columns */}
          {points.map((p, index) => {
            const colWidth = chartWidth / (data.length - 1);
            return (
              <rect
                key={index}
                x={p.x - colWidth / 2}
                y={paddingTop}
                width={colWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute bg-[#25382E] text-[#FFFAF1] p-2.5 rounded-xl shadow-md text-xs font-sans pointer-events-none space-y-0.5 border border-[#E5DACB]/30 z-10"
            style={{
              left: `${((points[hoveredIndex].x - paddingLeft) / chartWidth) * 100}%`,
              top: `${((points[hoveredIndex].y - paddingTop) / chartHeight) * 100 - 30}%`,
              transform: "translate(-50%, -100%)",
              whiteSpace: "nowrap",
            }}
          >
            <p className="text-[10px] text-[#F6C4C2] uppercase tracking-[0.1em]">{points[hoveredIndex].data.date}</p>
            <p className="text-xs font-serif font-bold text-[#FFFAF1]">₹{points[hoveredIndex].data.revenue.toLocaleString("en-IN")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
