"use client";

import * as React from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
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

interface CompactBarChartProps {
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
  barSize?: number;
  compact?: boolean;
}

// Custom Tooltip Component for CompactBarChart
const BarChartTooltip = ({ active, payload, label, valueFormatter }: any) => {
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
                  style={{ backgroundColor: entry.fill }}
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

export function CompactBarChart({
  data,
  categories,
  index,
  colors = ["hsl(var(--primary))", "hsl(var(--primary))"],
  valueFormatter = (value) => value.toString(),
  className,
  title,
  description,
  showTooltip = true,
  showGrid = false,
  showXAxis = true,
  showYAxis = true,
  barSize = 20,
  compact = true,
}: CompactBarChartProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader className={compact ? "pb-3" : ""}>
          {title && (
            <CardTitle className={compact ? "text-base" : ""}>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className={compact ? "text-sm" : ""}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={compact ? "pt-0" : ""}>
        <div className={compact ? "h-60" : "h-80"}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={data}
              margin={
                compact
                  ? { top: 10, right: 10, left: 0, bottom: 0 }
                  : { top: 10, right: 30, left: 0, bottom: 0 }
              }
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
              )}
              {showXAxis && (
                <XAxis
                  dataKey={index}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={compact ? 10 : 12}
                  tickLine={false}
                  axisLine={false}
                />
              )}
              {showYAxis && (
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={compact ? 10 : 12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={valueFormatter}
                />
              )}
              {showTooltip && (
                <Tooltip
                  content={<BarChartTooltip valueFormatter={valueFormatter} />}
                />
              )}
              {categories.map((category, i) => (
                <Bar
                  key={category}
                  dataKey={category}
                  fill={colors[i % colors.length]}
                  radius={[4, 4, 0, 0]}
                  barSize={barSize}
                />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
