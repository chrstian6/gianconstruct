"use client";

import * as React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PieChartProps {
  data: any[];
  category: string;
  value: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
  title?: string;
  description?: string;
  showTooltip?: boolean;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

// Custom Tooltip Component for PieChart
const PieChartTooltip = ({ active, payload, valueFormatter }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
        <div className="flex items-center mb-2">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: payload[0].color }}
          />
          <p className="font-medium text-foreground">{data.name}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Value</span>
            <span className="font-medium text-foreground">
              {valueFormatter ? valueFormatter(data.value) : data.value}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Percentage</span>
            <span className="font-medium text-foreground">
              {data.percentage ? `${data.percentage.toFixed(1)}%` : ""}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function PieChart({
  data,
  category,
  value,
  colors = [
    "oklch(var(--chart-1))",
    "oklch(var(--chart-2))",
    "oklch(var(--chart-3))",
    "oklch(var(--chart-4))",
    "oklch(var(--chart-5))",
  ],
  valueFormatter = (value) => value.toString(),
  className,
  title,
  description,
  showTooltip = true,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
}: PieChartProps) {
  // Calculate percentages for tooltip
  const total = data.reduce((sum, item) => sum + item[value], 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: total > 0 ? (item[value] / total) * 100 : 0,
  }));

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart
              margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
            >
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) =>
                  `${name}: ${percentage ? percentage.toFixed(1) : 0}%`
                }
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey={value}
                nameKey={category}
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              {showTooltip && (
                <Tooltip
                  content={<PieChartTooltip valueFormatter={valueFormatter} />}
                />
              )}
              {showLegend && (
                <Legend
                  wrapperStyle={{ paddingTop: 20 }}
                  formatter={(value, entry) => {
                    const item = dataWithPercentage.find(
                      (d) => d[category] === value
                    );
                    const percentage = item?.percentage
                      ? item.percentage.toFixed(1)
                      : "0.0";
                    return (
                      <span className="text-sm text-muted-foreground">
                        {value} ({percentage}%)
                      </span>
                    );
                  }}
                />
              )}
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
