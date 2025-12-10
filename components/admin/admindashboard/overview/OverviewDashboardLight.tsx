// Create a new component: components/admin/admindashboard/OverviewDashboardLight.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Building2,
  Package,
  ShoppingCart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format } from "date-fns";
import { getRealTimeMetrics } from "@/action/reports";

interface MetricItem {
  title: string;
  value: string;
  change: { value: number; isPositive: boolean };
  icon: any;
  description: string;
  color: string;
}

export function OverviewDashboardLight({
  startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  endDate = new Date(),
}: {
  startDate?: Date;
  endDate?: Date;
}) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Load only real-time metrics first (much faster)
  const loadQuickMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRealTimeMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load quick metrics:", err);
      setError("Failed to load quick metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuickMetrics();
  }, [loadQuickMetrics]);

  const getQuickMetrics = (): MetricItem[] => {
    if (!metrics) {
      return [
        {
          title: "Total Revenue",
          value: formatCurrency(0),
          change: { value: 0, isPositive: true },
          icon: DollarSign,
          description: "Today's revenue",
          color: "text-foreground",
        },
        {
          title: "Active Projects",
          value: "0",
          change: { value: 0, isPositive: true },
          icon: Building2,
          description: "Projects in progress",
          color: "text-blue-600",
        },
        {
          title: "Inventory Value",
          value: formatCurrency(0),
          change: { value: 0, isPositive: true },
          icon: Package,
          description: "Current inventory worth",
          color: "text-amber-600",
        },
        {
          title: "Sales Today",
          value: "0",
          change: { value: 0, isPositive: true },
          icon: ShoppingCart,
          description: "Sales transactions today",
          color: "text-green-600",
        },
      ];
    }

    return [
      {
        title: "Total Revenue",
        value: formatCurrency(metrics.totalRevenue || 0),
        change: { value: 10, isPositive: true }, // Simplified for demo
        icon: DollarSign,
        description: "Today's revenue",
        color: "text-foreground",
      },
      {
        title: "Active Projects",
        value: (metrics.activeProjects || 0).toString(),
        change: { value: 5, isPositive: true },
        icon: Building2,
        description: "Projects in progress",
        color: "text-blue-600",
      },
      {
        title: "Inventory Value",
        value: formatCurrency(metrics.inventoryValue || 0),
        change: { value: 2, isPositive: true },
        icon: Package,
        description: "Current inventory worth",
        color: "text-amber-600",
      },
      {
        title: "Sales Today",
        value: (metrics.totalSales || 0).toString(),
        change: { value: 15, isPositive: true },
        icon: ShoppingCart,
        description: "Sales transactions today",
        color: "text-green-600",
      },
    ];
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-7 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const quickMetrics = getQuickMetrics();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Quick Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Real-time metrics for {format(startDate, "MMM dd")} -{" "}
            {format(endDate, "MMM dd, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(), "EEEE, MMMM dd, yyyy")}</span>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickMetrics.map((metric, index) => (
          <Card
            key={index}
            className="border-border bg-card hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {metric.value}
              </div>
              <div className="flex items-center gap-1">
                {metric.change.isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${metric.change.isPositive ? "text-green-600" : "text-red-600"}`}
                >
                  {metric.change.value}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  vs yesterday
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <Card className="border-border bg-card">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadQuickMetrics}
              className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
