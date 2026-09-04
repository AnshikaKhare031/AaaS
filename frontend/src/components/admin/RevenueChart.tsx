import React, { useState } from "react";

export interface RevenueDataPoint {
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
      <div className="h-64 flex items-center justify-center text-slate-400 font-sans text-sm">
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
    const x = paddingLeft + (index / Math.max(data.length - 1, 1)) * chartWidth;
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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-slate-800">Revenue Performance</h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">Last 30 days of sales</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium font-sans">Total Sales</span>
          <p className="text-2xl font-serif font-bold text-accent">₹{totalRevenue.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto font-sans text-[10px] text-slate-400 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A56A43" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#A56A43" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y Axis Grid Lines & Labels */}
          {gridLines.map((line, idx) => (
            <g key={idx} className="opacity-70">
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={width - paddingRight}
                y2={line.y}
                stroke="#F1F5F9"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text x={paddingLeft - 10} y={line.y + 3} textAnchor="end" className="fill-slate-400 font-medium">
                ₹{line.value >= 1000 ? `${(line.value / 1000).toFixed(1)}k` : line.value}
              </text>
            </g>
          ))}

          {/* Shaded Area */}
          {areaPath && (
            <path d={areaPath} fill="url(#revenueGradient)" />
          )}

          {/* Trend Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#A56A43"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points & hover triggers */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === idx ? 5 : 2.5}
                className={`transition-all duration-150 ${
                  hoveredIndex === idx
                    ? "fill-accent stroke-white stroke-2"
                    : "fill-accent/70"
                }`}
              />
              {/* Invisible touch/mouse target */}
              <rect
                x={p.x - 10}
                y={paddingTop}
                width={20}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}

          {/* X Axis Baseline */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="#E2E8F0"
            strokeWidth={1}
          />

          {/* X Axis Labels */}
          {points.filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1).map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={paddingTop + chartHeight + 20}
              textAnchor="middle"
              className="fill-slate-400 font-medium"
            >
              {p.data.date}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute bg-slate-900 text-white text-xs rounded-xl py-1.5 px-3 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full font-sans transition-all"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100}%`,
              marginTop: "-8px",
            }}
          >
            <p className="font-semibold">₹{points[hoveredIndex].data.revenue.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-slate-400">{points[hoveredIndex].data.date}</p>
          </div>
        )}
      </div>
    </div>
  );
}
