"use client";

import * as React from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AreaChartProps {
  data: any[];
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
  title?: string;
  description?: string;
  showTooltip?: boolean;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
}

// Custom Tooltip Component for AreaChart
const AreaChartTooltip = ({ active, payload, label, valueFormatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center">
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.dataKey}
                </span>
              </div>
              <span className="font-medium text-foreground">
                {valueFormatter ? valueFormatter(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function AreaChart({
  data,
  categories,
  index,
  colors = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
  ],
  valueFormatter = (value) => value.toString(),
  className,
  title,
  description,
  showTooltip = true,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
}: AreaChartProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div className="h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsAreaChart
              data={data}
              // Optimized margins for visibility
              margin={{ top: 25, right: 30, left: 25, bottom: 25 }}
              // Remove overflow clipping to maintain text visibility
              style={{ overflow: "visible" }}
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                  // Keep grid within bounds
                  strokeOpacity={0.3}
                />
              )}

              {showXAxis && (
                <XAxis
                  dataKey={index}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  // Ensure text visibility
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  // Add padding and adjust tick count
                  padding={{ left: 10, right: 10 }}
                  minTickGap={15}
                  // Allow enough height for labels
                  height={40}
                  // Prevent text clipping
                  interval="preserveStartEnd"
                  // Ensure text is visible
                  style={{
                    fontSize: "12px",
                    fontFamily: "inherit",
                  }}
                />
              )}

              {showYAxis && (
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={valueFormatter}
                  // Ensure text visibility
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  // Allow enough width for labels
                  width={65}
                  // Add padding to prevent curve from touching edges
                  domain={["auto", "auto"]}
                  // Allow more ticks for better visibility
                  tickCount={6}
                  // Prevent text clipping
                  style={{
                    fontSize: "12px",
                    fontFamily: "inherit",
                  }}
                />
              )}

              {showTooltip && (
                <Tooltip
                  content={<AreaChartTooltip valueFormatter={valueFormatter} />}
                  // Ensure tooltip is above everything
                  wrapperStyle={{ zIndex: 1000 }}
                />
              )}

              {categories.map((category, i) => (
                <Area
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stackId="1"
                  stroke={colors[i % colors.length]}
                  fill={`url(#color-${category})`}
                  strokeWidth={2}
                  // Connect nulls to prevent gaps
                  connectNulls={true}
                  // Add visible dots
                  dot={{
                    strokeWidth: 2,
                    r: 3,
                    fill: colors[i % colors.length],
                    stroke: "hsl(var(--background))",
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: "hsl(var(--background))",
                  }}
                  // NO clipPath on Area - allows curve to render naturally
                  // but use baseValue to prevent going below axis
                  baseValue="dataMin"
                />
              ))}

              <defs>
                {categories.map((category, i) => (
                  <linearGradient
                    key={category}
                    id={`color-${category}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={colors[i % colors.length]}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="100%"
                      stopColor={colors[i % colors.length]}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
            </RechartsAreaChart>
          </ResponsiveContainer>

          {/* Add CSS overrides to ensure text visibility */}
          <style jsx global>{`
            .recharts-wrapper .recharts-cartesian-axis-tick-value tspan {
              fill: hsl(var(--muted-foreground)) !important;
              font-size: 12px !important;
              font-family: inherit !important;
              dominant-baseline: middle !important;
            }

            .recharts-wrapper .recharts-text {
              fill: hsl(var(--muted-foreground)) !important;
            }

            /* Ensure all text elements are visible */
            .recharts-wrapper text {
              fill: hsl(var(--muted-foreground)) !important;
            }

            /* Prevent curve from going too far */
            .recharts-curve {
              shape-rendering: geometricPrecision;
            }
          `}</style>
        </div>
      </CardContent>
    </Card>
  );
}
