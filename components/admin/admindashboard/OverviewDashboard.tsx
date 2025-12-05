"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Building2,
  Package,
  ShoppingCart,
  Activity,
  CheckCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { format } from "date-fns";
import { generateReport, type ReportFilters } from "@/action/reports";
import { OverviewDashboardSkeleton } from "@/components/admin/admindashboard/skeleton/OverviewDashboardSkeleton";

// Monochromatic gradient colors
const MONOCHROMATIC_GRADIENTS = [
  "hsl(0, 0%, 20%)", // Dark Gray
  "hsl(0, 0%, 40%)", // Medium Gray
  "hsl(0, 0%, 60%)", // Light Gray
  "hsl(0, 0%, 80%)", // Very Light Gray
];

const DEFAULT_CHART_COLORS = MONOCHROMATIC_GRADIENTS;

interface OverviewDashboardProps {
  startDate?: Date;
  endDate?: Date;
}

interface MetricItem {
  title: string;
  value: string;
  change: { value: number; isPositive: boolean };
  icon: any;
  description: string;
  color: string;
}

interface RevenueTrendItem {
  date: string;
  Revenue: number;
}

interface ProjectStatusItem {
  name: string;
  value: number;
}

interface TransactionItem {
  id: number;
  type: string;
  amount: string;
  description: string;
  date: string;
  status: string;
}

// Custom AreaChart wrapper with fixed sizing
const RevenueTrendChart = ({ data }: { data: RevenueTrendItem[] }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-muted-foreground">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[200px]">
      <AreaChart
        data={data}
        categories={["Revenue"]}
        index="date"
        valueFormatter={(value) => {
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        }}
        colors={[DEFAULT_CHART_COLORS[0]]}
        showTooltip={true}
        showGrid={true}
        showXAxis={true}
        showYAxis={true}
        // Remove problematic classes and use simpler approach
        className="w-full h-full"
      />
    </div>
  );
};

export function OverviewDashboard({
  startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  endDate = new Date(),
}: OverviewDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // Memoize dates to prevent infinite re-renders
  const memoizedStartDate = useMemo(
    () => startDate,
    [startDate.getFullYear(), startDate.getMonth(), startDate.getDate()]
  );

  const memoizedEndDate = useMemo(
    () => endDate,
    [endDate.getFullYear(), endDate.getMonth(), endDate.getDate()]
  );

  const loadOverviewData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ReportFilters = {
        period: "monthly",
        startDate: memoizedStartDate,
        endDate: memoizedEndDate,
      };
      const data = await generateReport(filters);
      setOverviewData(data);

      // For comparison (previous period)
      const prevStart = new Date(memoizedStartDate);
      prevStart.setMonth(prevStart.getMonth() - 1);
      const prevEnd = new Date(memoizedEndDate);
      prevEnd.setMonth(prevEnd.getMonth() - 1);

      const prevFilters: ReportFilters = {
        period: "monthly",
        startDate: prevStart,
        endDate: prevEnd,
      };
      const prevData = await generateReport(prevFilters);
      setComparisonData(prevData);
    } catch (error) {
      console.error("Failed to load overview data:", error);
    } finally {
      setLoading(false);
    }
  }, [memoizedStartDate, memoizedEndDate]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 100, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change >= 0,
    };
  };

  // Prepare metrics data
  const getMetrics = (): MetricItem[] => {
    if (!overviewData?.metrics || !comparisonData?.metrics) return [];

    const metrics = overviewData.metrics;
    const prevMetrics = comparisonData.metrics;

    return [
      {
        title: "Total Revenue",
        value: formatCurrency(metrics.totalRevenue),
        change: calculateChange(metrics.totalRevenue, prevMetrics.totalRevenue),
        icon: DollarSign,
        description: "Combined revenue from all sources",
        color: "text-foreground",
      },
      {
        title: "Active Projects",
        value: metrics.activeProjects.toString(),
        change: calculateChange(
          metrics.activeProjects,
          prevMetrics.activeProjects
        ),
        icon: Building2,
        description: "Projects currently in progress",
        color: "text-blue-600",
      },
      {
        title: "Inventory Value",
        value: formatCurrency(metrics.inventoryValue),
        change: calculateChange(
          metrics.inventoryValue,
          prevMetrics.inventoryValue
        ),
        icon: Package,
        description: "Total value of inventory stock",
        color: "text-amber-600",
      },
      {
        title: "Sales Performance",
        value: metrics.totalSales.toString(),
        change: calculateChange(metrics.totalSales, prevMetrics.totalSales),
        icon: ShoppingCart,
        description: "Total sales transactions",
        color: "text-green-600",
      },
      {
        title: "User Activity",
        value: "92%",
        change: { value: 8, isPositive: true },
        icon: Activity,
        description: "Active user engagement rate",
        color: "text-purple-600",
      },
      {
        title: "Task Completion",
        value: "78%",
        change: { value: 12, isPositive: true },
        icon: CheckCircle,
        description: "Completed scheduled tasks",
        color: "text-emerald-600",
      },
    ];
  };

  // Prepare revenue trend data
  const prepareRevenueTrendData = (): RevenueTrendItem[] => {
    if (!overviewData?.revenueTrend) return [];
    return overviewData.revenueTrend.slice(-14).map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      Revenue: item.totalRevenue,
    }));
  };

  // Prepare project status data
  const prepareProjectStatusData = (): ProjectStatusItem[] => {
    if (!overviewData?.projectStatus) return [];
    return overviewData.projectStatus.map((item: any) => ({
      name: item.status,
      value: item.count,
    }));
  };

  // Prepare recent transactions
  const getRecentTransactions = (): TransactionItem[] => {
    if (!overviewData?.recentTransactions) return [];
    return overviewData.recentTransactions.slice(0, 5).map((tx: any) => ({
      id: tx.id,
      type: tx.type,
      amount: formatCurrency(tx.amount),
      description: tx.description,
      date: format(new Date(tx.date), "MMM dd, yyyy"),
      status: tx.status,
    }));
  };

  // Show skeleton loading state
  if (loading) {
    return <OverviewDashboardSkeleton />;
  }

  const metrics = getMetrics();
  const revenueData = prepareRevenueTrendData();
  const projectStatusData = prepareProjectStatusData();
  const recentTransactions = getRecentTransactions();

  // Calculate total projects for percentage
  const totalProjects = projectStatusData.reduce(
    (sum: number, p: ProjectStatusItem) => sum + p.value,
    0
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Performance metrics and analytics for{" "}
            {format(memoizedStartDate, "MMM dd")} -{" "}
            {format(memoizedEndDate, "MMM dd, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(), "EEEE, MMMM dd, yyyy")}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
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
              <div className="flex items-center justify-between">
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
                    {metric.change.isPositive ? "increase" : "decrease"} from
                    last period
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend - Fixed with proper curve boundaries */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue Trend</CardTitle>
            <p className="text-sm text-muted-foreground">
              14-day revenue performance
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {revenueData.length > 0 ? (
                <AreaChart
                  data={revenueData}
                  categories={["Revenue"]}
                  index="date"
                  valueFormatter={(value) => formatCurrency(value)}
                  colors={[DEFAULT_CHART_COLORS[0]]}
                  showTooltip={true}
                  showGrid={true}
                  showXAxis={true}
                  showYAxis={true}
                  // Add custom styling to fix curve overflow
                  className="[&_.recharts-curve]:clip-path-inset-1 [&_.recharts-area]:overflow-visible"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    No revenue data available
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card className="border-border bg-card flex flex-col">
          <CardHeader>
            <CardTitle className="text-foreground">Project Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution of projects by status
            </p>
          </CardHeader>
          <CardContent className="flex-1 p-4">
            <div className="h-[250px]">
              {projectStatusData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <div className="space-y-3 overflow-y-auto max-h-full">
                    {projectStatusData.map(
                      (item: ProjectStatusItem, index: number) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: DEFAULT_CHART_COLORS[index],
                              }}
                            />
                            <span className="text-sm text-foreground">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {item.value}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              (
                              {totalProjects > 0
                                ? Math.round((item.value / totalProjects) * 100)
                                : 0}
                              %)
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      {/* Simple pie chart visualization */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xl font-bold text-foreground">
                            {overviewData?.metrics?.totalProjects || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total Projects
                          </div>
                        </div>
                      </div>
                      {/* Pie segments */}
                      <svg className="w-full h-full transform -rotate-90">
                        {(() => {
                          const total = projectStatusData.reduce(
                            (sum: number, p: ProjectStatusItem) =>
                              sum + p.value,
                            0
                          );
                          let currentAngle = 0;
                          return projectStatusData.map(
                            (item: ProjectStatusItem, index: number) => {
                              const percentage =
                                total > 0 ? (item.value / total) * 100 : 0;
                              const angle = (percentage / 100) * 360;
                              const nextAngle = currentAngle + angle;

                              const segment = (
                                <circle
                                  key={item.name}
                                  cx="50%"
                                  cy="50%"
                                  r="40%"
                                  fill="transparent"
                                  stroke={DEFAULT_CHART_COLORS[index]}
                                  strokeWidth="16"
                                  strokeDasharray={`${percentage} ${100 - percentage}`}
                                  strokeDashoffset={100 - currentAngle}
                                />
                              );

                              currentAngle = nextAngle;
                              return segment;
                            }
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    No project data available
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              Recent Transactions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Latest financial activities
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground">Description</TableHead>
                  <TableHead className="text-foreground">Type</TableHead>
                  <TableHead className="text-foreground">Amount</TableHead>
                  <TableHead className="text-foreground">Date</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((tx: TransactionItem) => (
                    <TableRow key={tx.id} className="hover:bg-accent/50">
                      <TableCell className="font-medium text-foreground">
                        {tx.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${tx.type === "sale" ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                        >
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {tx.amount}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tx.date}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.status === "completed" ? "default" : "secondary"
                          }
                          className={
                            tx.status === "completed"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : ""
                          }
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      No recent transactions
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Stats & Insights */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              Performance Insights
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Key performance indicators and insights
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Inventory Status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  Inventory Health
                </span>
                <Badge
                  variant={
                    (overviewData?.metrics?.lowStockItems || 0) > 5
                      ? "destructive"
                      : (overviewData?.metrics?.lowStockItems || 0) > 0
                        ? "secondary"
                        : "outline"
                  }
                >
                  {(overviewData?.metrics?.lowStockItems || 0) > 0
                    ? `${overviewData.metrics.lowStockItems} items low`
                    : "All Good"}
                </Badge>
              </div>
              <Progress
                value={
                  100 -
                  Math.min(
                    100,
                    ((overviewData?.metrics?.lowStockItems || 0) / 20) * 100
                  )
                }
                className="h-2"
              />
            </div>

            {/* Project Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  Project Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {overviewData?.metrics?.completedProjects || 0} of{" "}
                  {overviewData?.metrics?.totalProjects || 0} completed
                </span>
              </div>
              <Progress
                value={
                  overviewData?.metrics?.totalProjects
                    ? (overviewData.metrics.completedProjects /
                        overviewData.metrics.totalProjects) *
                      100
                    : 0
                }
                className="h-2"
              />
            </div>

            {/* Revenue Distribution */}
            <div className="space-y-3">
              <span className="text-sm font-medium text-foreground">
                Revenue Distribution
              </span>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Inventory Sales
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {formatCurrency(
                      overviewData?.metrics?.inventoryRevenue || 0
                    )}
                  </span>
                </div>
                <Progress
                  value={
                    overviewData?.metrics?.totalRevenue
                      ? (overviewData.metrics.inventoryRevenue /
                          overviewData.metrics.totalRevenue) *
                        100
                      : 0
                  }
                  className="h-1.5"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Project Revenue
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {formatCurrency(overviewData?.metrics?.projectRevenue || 0)}
                  </span>
                </div>
                <Progress
                  value={
                    overviewData?.metrics?.totalRevenue
                      ? (overviewData.metrics.projectRevenue /
                          overviewData.metrics.totalRevenue) *
                        100
                      : 0
                  }
                  className="h-1.5"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-border">
              <span className="text-sm font-medium text-foreground mb-3 block">
                Quick Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => (window.location.href = "#reports")}
                  className="text-xs px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Generate Report
                </button>
                <button
                  onClick={() => (window.location.href = "#overview")}
                  className="text-xs px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                >
                  View Analytics
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
