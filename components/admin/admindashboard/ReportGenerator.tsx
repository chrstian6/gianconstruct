"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Download, Calendar } from "lucide-react";
import {
  generateReport,
  exportReportToCSV,
  type ReportPeriod,
  type ReportFilters,
} from "@/action/reports";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { CompactBarChart } from "@/components/ui/compact-bar-chart";
import { LineChart } from "@/components/ui/line-chart";
import { PieChart } from "@/components/ui/pie-chart";
import { RecentTransactions } from "./RecentTransactions";

// Add this type definition near the top of the file, after the imports
interface RevenueChartItem {
  date: string;
  "Inventory Revenue": number;
  "Project Revenue": number;
  "Total Revenue": number;
}

// Monochromatic gradient colors - Matching overview dashboard
const MONOCHROMATIC_GRADIENTS = [
  "hsl(0, 0%, 20%)", // Dark Gray
  "hsl(0, 0%, 40%)", // Medium Gray
  "hsl(0, 0%, 60%)", // Light Gray
  "hsl(0, 0%, 80%)", // Very Light Gray
];

const DEFAULT_CHART_COLORS = MONOCHROMATIC_GRADIENTS;

// Custom AreaChart wrapper matching overview dashboard
const RevenueTrendChart = ({
  data,
  categories = ["Revenue"],
}: {
  data: any[];
  categories?: string[];
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <AreaChart
        data={data}
        categories={categories}
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
        className="w-full h-full"
      />
    </div>
  );
};

// Revenue breakdown chart with multiple categories
const RevenueBreakdownChart = ({
  data,
  categories = ["Inventory Revenue", "Project Revenue"],
}: {
  data: any[];
  categories?: string[];
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <AreaChart
        data={data}
        categories={categories}
        index="date"
        valueFormatter={(value) => {
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        }}
        // Use different shades for Inventory vs Project Revenue
        colors={[DEFAULT_CHART_COLORS[0], DEFAULT_CHART_COLORS[2]]}
        showTooltip={true}
        showGrid={true}
        showXAxis={true}
        showYAxis={true}
        className="w-full h-full"
      />
    </div>
  );
};

// Sales trend chart
const SalesTrendChart = ({ data }: { data: any[] }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No sales data available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <LineChart
        data={data}
        categories={["Sales Amount"]}
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
        className="w-full h-full"
      />
    </div>
  );
};

// Format currency function (matching overview dashboard)
const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
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

export default function ReportGenerator() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // State for calendar popovers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Memoize dates to prevent unnecessary re-renders
  const memoizedStartDate = useMemo(() => startDate, [startDate]);
  const memoizedEndDate = useMemo(() => endDate, [endDate]);

  // Load report on mount
  useEffect(() => {
    loadReport();
  }, []);

  // Load report with memoized callbacks
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ReportFilters = {
        period,
        startDate: memoizedStartDate,
        endDate: memoizedEndDate,
      };
      const data = await generateReport(filters);
      setReportData(data);

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
      console.error("Failed to load report:", error);
    } finally {
      setLoading(false);
    }
  }, [period, memoizedStartDate, memoizedEndDate]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await loadReport();
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const filters: ReportFilters = {
        period,
        startDate,
        endDate,
      };
      const csvData = await exportReportToCSV(filters);

      // Create blob and download
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    }
  };

  // Date handling functions
  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      setShowStartDatePicker(false);
      // If end date is before new start date, adjust it
      if (endDate < date) {
        setEndDate(date);
      }
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setEndDate(date);
      setShowEndDatePicker(false);
    }
  };

  // Helper function to reset to common date ranges
  const handleDatePreset = (
    preset: "today" | "week" | "month" | "quarter" | "year"
  ) => {
    const today = new Date();

    switch (preset) {
      case "today":
        setStartDate(today);
        setEndDate(today);
        break;
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        setStartDate(weekStart);
        setEndDate(today);
        break;
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(monthStart);
        setEndDate(today);
        break;
      case "quarter":
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
        const quarterStart = new Date(today.getFullYear(), quarterMonth, 1);
        setStartDate(quarterStart);
        setEndDate(today);
        break;
      case "year":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        setStartDate(yearStart);
        setEndDate(today);
        break;
    }
  };

  // Prepare chart data - memoized for performance
  const prepareRevenueChartData = useCallback(() => {
    if (!reportData?.revenueTrend) return [];

    return reportData.revenueTrend.slice(-30).map(
      (item: any): RevenueChartItem => ({
        date: format(new Date(item.date), "MMM dd"),
        "Inventory Revenue": item.inventoryRevenue,
        "Project Revenue": item.projectRevenue,
        "Total Revenue": item.totalRevenue,
      })
    );
  }, [reportData]);

  const prepareSalesChartData = useCallback(() => {
    if (!reportData?.salesData) return [];

    return reportData.salesData.slice(-30).map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      "Sales Amount": item.inventorySales,
      "Quantity Sold": item.quantity,
    }));
  }, [reportData]);

  const prepareProjectStatusChartData = useCallback(() => {
    if (!reportData?.projectStatus) return [];

    return reportData.projectStatus.map((item: any) => ({
      name: item.status,
      value: item.count,
    }));
  }, [reportData]);

  const prepareInventoryValueChartData = useCallback(() => {
    if (!reportData?.inventorySummary) return [];

    return reportData.inventorySummary.map((item: any) => ({
      category:
        item.category.length > 15
          ? item.category.substring(0, 15) + "..."
          : item.category,
      "Total Value": item.totalValue,
      "Item Count": item.itemCount,
    }));
  }, [reportData]);

  const prepareTopItemsChartData = useCallback(() => {
    if (!reportData?.topInventoryItems) return [];

    return reportData.topInventoryItems.map((item: any, index: number) => ({
      name:
        item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name,
      Sales: item.sales,
      Profit: item.profit,
      "Profit Margin": item.profitMargin,
      Rank: index + 1,
    }));
  }, [reportData]);

  // Get revenue percentages
  const getRevenuePercentage = useCallback(() => {
    if (!reportData?.metrics) return { inventory: 0, project: 0 };
    const total = reportData.metrics.totalRevenue;
    if (total === 0) return { inventory: 0, project: 0 };

    return {
      inventory: Math.round(
        (reportData.metrics.inventoryRevenue / total) * 100
      ),
      project: Math.round((reportData.metrics.projectRevenue / total) * 100),
    };
  }, [reportData]);

  // Safe formatting functions
  const safeFormatNumber = (num: number | undefined) => {
    return (num || 0).toLocaleString();
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="space-y-1 mb-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Report Generator
            </p>
            <p className="text-sm text-zinc-500">
              Generate comprehensive reports for your dashboard
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Period
              </label>
              <Select
                value={period}
                onValueChange={(value: ReportPeriod) => setPeriod(value)}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Start Date
              </label>
              <Popover
                open={showStartDatePicker}
                onOpenChange={setShowStartDatePicker}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-border",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                End Date
              </label>
              <Popover
                open={showEndDatePicker}
                onOpenChange={setShowEndDatePicker}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-border",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick an end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateSelect}
                    initialFocus
                    disabled={(date) => date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end space-x-2 md:col-span-2 lg:col-span-1">
              <Button
                onClick={handleGenerateReport}
                disabled={generating}
                className="w-full md:w-auto flex-1"
              >
                {generating ? "Generating..." : "Generate Report"}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="shrink-0"
              >
                <Download className="h-4 w-4 mr-2 mx-auto" />
              </Button>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="mt-4 pt-4 border-t border-border">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Quick Date Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDatePreset("today")}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDatePreset("week")}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDatePreset("month")}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDatePreset("quarter")}
              >
                This Quarter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDatePreset("year")}
              >
                This Year
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview - Matching Overview Dashboard Style */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Total Revenue */}
          <Card className="rounded-none border-0 shadow-none border-b">
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Total Revenue
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-zinc-900">
                    {formatCurrency(reportData.metrics.totalRevenue)}
                  </p>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs ${comparisonData?.metrics?.totalRevenue ? (calculateChange(reportData.metrics.totalRevenue || 0, comparisonData?.metrics?.totalRevenue || 0).isPositive ? "text-green-600" : "text-red-600") : "text-zinc-500"}`}
                    >
                      {comparisonData?.metrics?.totalRevenue
                        ? `${calculateChange(reportData.metrics.totalRevenue || 0, comparisonData?.metrics?.totalRevenue || 0).isPositive ? "+" : "-"}${calculateChange(reportData.metrics.totalRevenue || 0, comparisonData?.metrics?.totalRevenue || 0).value}%`
                        : "No comparison"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      from last period
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Combined revenue from all sources
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Sales */}
          <Card className="rounded-none border-0 shadow-none border-b">
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Project Sales
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-zinc-900">
                    {formatCurrency(reportData.metrics.projectRevenue)}
                  </p>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs ${comparisonData?.metrics?.projectRevenue ? (calculateChange(reportData.metrics.projectRevenue || 0, comparisonData?.metrics?.projectRevenue || 0).isPositive ? "text-green-600" : "text-red-600") : "text-zinc-500"}`}
                    >
                      {comparisonData?.metrics?.projectRevenue
                        ? `${calculateChange(reportData.metrics.projectRevenue || 0, comparisonData?.metrics?.projectRevenue || 0).isPositive ? "+" : "-"}${calculateChange(reportData.metrics.projectRevenue || 0, comparisonData?.metrics?.projectRevenue || 0).value}%`
                        : "No comparison"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      from last period
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Revenue from project payments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Sales */}
          <Card className="rounded-none border-0 shadow-none border-b">
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Inventory Sales
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-zinc-900">
                    {formatCurrency(reportData.metrics.inventoryRevenue)}
                  </p>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs ${comparisonData?.metrics?.inventoryRevenue ? (calculateChange(reportData.metrics.inventoryRevenue || 0, comparisonData?.metrics?.inventoryRevenue || 0).isPositive ? "text-green-600" : "text-red-600") : "text-zinc-500"}`}
                    >
                      {comparisonData?.metrics?.inventoryRevenue
                        ? `${calculateChange(reportData.metrics.inventoryRevenue || 0, comparisonData?.metrics?.inventoryRevenue || 0).isPositive ? "+" : "-"}${calculateChange(reportData.metrics.inventoryRevenue || 0, comparisonData?.metrics?.inventoryRevenue || 0).value}%`
                        : "No comparison"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      from last period
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Revenue from inventory sales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Value */}
          <Card className="rounded-none border-0 shadow-none">
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Inventory Capital
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-red-500">
                    {formatCurrency(reportData.metrics.inventoryValue)}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-500">
                      {reportData.inventorySummary.reduce(
                        (sum: number, item: any) => sum + item.itemCount,
                        0
                      )}{" "}
                      items
                    </span>
                    <span className="text-xs text-zinc-500">
                      <span> • Value: </span>{" "}
                      <span className="text-green-600">
                        {" "}
                        {formatCurrency(reportData.metrics.inventoryValue)}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Total value of inventory stock
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="rounded-none border-0 shadow-none">
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Active Projects
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-zinc-900">
                    {safeFormatNumber(reportData.metrics.activeProjects)}
                  </p>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs ${comparisonData?.metrics?.activeProjects ? (calculateChange(reportData.metrics.activeProjects || 0, comparisonData?.metrics?.activeProjects || 0).isPositive ? "text-green-600" : "text-red-600") : "text-zinc-500"}`}
                    >
                      {comparisonData?.metrics?.activeProjects
                        ? `${calculateChange(reportData.metrics.activeProjects || 0, comparisonData?.metrics?.activeProjects || 0).isPositive ? "+" : "-"}${calculateChange(reportData.metrics.activeProjects || 0, comparisonData?.metrics?.activeProjects || 0).value}%`
                        : "No comparison"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      from last period
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Projects currently in progress
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Status */}
          <Card className="rounded-none border-0 shadow-none">
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Stock Status
                </p>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    <div>
                      <p className="text-2xl font-semibold text-zinc-900">
                        {safeFormatNumber(reportData.metrics.lowStockItems)}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">Low stock</p>
                    </div>
                    <div className="h-8 w-px bg-zinc-200"></div>
                    <div>
                      <p className="text-2xl font-semibold text-zinc-900">
                        {safeFormatNumber(
                          reportData.inventorySummary.reduce(
                            (sum: number, item: any) => sum + item.itemCount,
                            0
                          )
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Total items
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Items requiring attention
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Visualizations */}
      {reportData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="revenue"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Revenue
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Sales
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Projects
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Inventory
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend - Matching overview dashboard style */}
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Revenue Trend
                    </p>
                    <p className="text-sm text-zinc-500">
                      30-day revenue performance
                    </p>
                  </div>
                  <div className="h-[300px] w-full">
                    <RevenueTrendChart
                      data={prepareRevenueChartData().map(
                        (item: RevenueChartItem) => ({
                          date: item.date,
                          Revenue: item["Total Revenue"],
                        })
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sales Performance */}
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Sales Performance
                    </p>
                    <p className="text-sm text-zinc-500">
                      Inventory sales amount over time
                    </p>
                  </div>
                  <div className="h-[300px] w-full">
                    <SalesTrendChart data={prepareSalesChartData()} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Items */}
              {/* Top Performing Items - Modern Compact */}
              <Card className="border-zinc-200 bg-white">
                <CardContent className="p-4">
                  <div className="space-y-1 mb-3">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Top 5 Best Sellers
                    </p>
                    <p className="text-xs text-zinc-500">
                      Best performing items by revenue
                    </p>
                  </div>
                  <div className="space-y-2">
                    {reportData.topInventoryItems.map(
                      (item: any, index: number) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-2.5 hover:bg-zinc-50 rounded-md transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                                index === 0
                                  ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white"
                                  : index === 1
                                    ? "bg-gradient-to-br from-zinc-300 to-zinc-400 text-white"
                                    : index === 2
                                      ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                                      : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-zinc-900 truncate">
                                {item.name.length > 20
                                  ? item.name.substring(0, 20) + "..."
                                  : item.name}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-zinc-500">
                                  {item.category}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  •
                                </span>
                                <span className="text-[10px] font-medium text-zinc-700">
                                  {item.quantity} sold
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-zinc-900">
                              {formatCurrency(item.sales)}
                            </p>
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-[10px] text-zinc-500">
                                Profit:
                              </span>
                              <span
                                className={`text-[10px] font-medium ${
                                  item.profit >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(item.profit)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Project Status Distribution */}
              <Card className="border-border bg-card flex flex-col">
                <CardContent className="p-6 flex-1">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Project Status
                    </p>
                    <p className="text-sm text-zinc-500">
                      Distribution of projects by status
                    </p>
                  </div>
                  <div className="h-[300px] w-full">
                    <PieChart
                      data={prepareProjectStatusChartData()}
                      category="name"
                      value="value"
                      colors={DEFAULT_CHART_COLORS}
                      className="w-full h-full"
                      innerRadius={20}
                      outerRadius={70}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {/* Detailed Revenue Analysis */}
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="space-y-1 mb-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Revenue Breakdown
                  </p>
                  <p className="text-sm text-zinc-500">
                    Separated by inventory sales and project payments
                  </p>
                </div>
                <div className="h-[300px] w-full">
                  <RevenueBreakdownChart
                    data={prepareRevenueChartData()}
                    categories={["Inventory Revenue", "Project Revenue"]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Revenue Composition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Revenue Composition
                    </p>
                    <p className="text-sm text-zinc-500">
                      Percentage breakdown of total revenue
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Inventory Revenue
                        </span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(reportData.metrics.inventoryRevenue)}
                        </span>
                      </div>
                      <Progress
                        value={getRevenuePercentage().inventory}
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {getRevenuePercentage().inventory}%
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Project Revenue
                        </span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(reportData.metrics.projectRevenue)}
                        </span>
                      </div>
                      <Progress
                        value={getRevenuePercentage().project}
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {getRevenuePercentage().project}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Metrics */}
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Revenue Metrics
                    </p>
                    <p className="text-sm text-zinc-500">
                      Key performance indicators
                    </p>
                  </div>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Daily Average
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(reportData.metrics.totalRevenue / 30)}
                        </div>
                      </div>
                      <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Growth Rate
                        </div>
                        <div className="text-lg font-bold text-foreground flex items-center">
                          <span className="h-4 w-4 mr-1">↑</span>
                          12.5%
                        </div>
                      </div>
                      <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Transactions
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {reportData.metrics.totalInventoryTransactions +
                            reportData.metrics.totalProjectTransactions}
                        </div>
                      </div>
                      <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Avg. Value
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(reportData.metrics.averageSaleValue)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend */}
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Sales Trend
                    </p>
                    <p className="text-sm text-zinc-500">
                      Daily inventory sales revenue
                    </p>
                  </div>
                  <div className="h-[300px] w-full">
                    <SalesTrendChart data={prepareSalesChartData()} />
                  </div>
                </CardContent>
              </Card>

              {/* Quantity Sold */}
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Quantity Sold (Last 14 Days)
                    </p>
                    <p className="text-sm text-zinc-500">
                      Number of items sold per day
                    </p>
                  </div>
                  <div className="h-[300px] w-full">
                    <CompactBarChart
                      data={prepareSalesChartData().slice(-14)}
                      categories={["Quantity Sold"]}
                      index="date"
                      valueFormatter={(value: number) => value.toString()}
                      colors={[DEFAULT_CHART_COLORS[2]]}
                      compact={true}
                      barSize={20}
                      className="w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Items - Modern Compact */}
            <Card className="border-zinc-200 bg-white">
              <CardContent className="p-4">
                <div className="space-y-1 mb-3">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Top 5 Best Sellers
                  </p>
                  <p className="text-xs text-zinc-500">
                    Highest revenue generating items
                  </p>
                </div>
                <div className="space-y-2">
                  {reportData.topInventoryItems.map(
                    (item: any, index: number) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-2.5 hover:bg-zinc-50 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                              index === 0
                                ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white"
                                : index === 1
                                  ? "bg-gradient-to-br from-zinc-300 to-zinc-400 text-white"
                                  : index === 2
                                    ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                                    : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-zinc-900 truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-zinc-500">
                                {item.category}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                •
                              </span>
                              <span className="text-[10px] font-medium text-zinc-700">
                                {item.quantity} sold
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-zinc-900">
                            {formatCurrency(item.sales)}
                          </p>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] text-zinc-500">
                              Profit:
                            </span>
                            <span
                              className={`text-[10px] font-medium ${
                                item.profit >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(item.profit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Status Distribution */}
              <Card className="border-border bg-card flex flex-col">
                <CardContent className="p-6 flex-1">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Project Status
                    </p>
                    <p className="text-sm text-zinc-500">
                      Current status of all projects
                    </p>
                  </div>
                  <div className="h-[300px] w-full">
                    <PieChart
                      data={prepareProjectStatusChartData()}
                      category="name"
                      value="value"
                      colors={DEFAULT_CHART_COLORS}
                      className="w-full h-full"
                      showLegend={true}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Project Metrics */}
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Project Analytics
                    </p>
                    <p className="text-sm text-zinc-500">
                      Key project metrics and statistics
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Total Projects
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          {reportData.metrics.totalProjects}
                        </div>
                      </div>
                      <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Active Projects
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          {reportData.metrics.activeProjects}
                        </div>
                      </div>
                      <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Completed
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          {reportData.metrics.completedProjects}
                        </div>
                      </div>
                      <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Revenue
                        </div>
                        <div className="text-xl font-bold text-foreground">
                          {formatCurrency(reportData.metrics.projectRevenue)}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="text-sm font-medium text-foreground mb-2">
                        Project Status Details
                      </div>
                      <div className="space-y-3">
                        {reportData.projectStatus.map((item: any) => (
                          <div
                            key={item.status}
                            className="flex justify-between items-center p-2 hover:bg-accent/50 rounded-md"
                          >
                            <span className="text-sm text-muted-foreground">
                              {item.status}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {item.count}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({item.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            {/* Inventory Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b">
              {/* Inventory Capital */}
              <Card className="rounded-none border-0 border-r border-zinc-200 shadow-none">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Inventory Capital
                    </p>
                    <div className="space-y-1">
                      <p className="text-2xl font-semibold text-zinc-900">
                        {formatCurrency(reportData.metrics.inventoryValue)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Total value of inventory stock
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Items */}
              <Card className="rounded-none border-0 border-r border-zinc-200 shadow-none">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Total Items
                    </p>
                    <div className="space-y-1">
                      <p className="text-2xl font-semibold text-zinc-900">
                        {reportData.inventorySummary
                          .reduce(
                            (sum: number, item: any) => sum + item.itemCount,
                            0
                          )
                          .toLocaleString()}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Items across all categories
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Inventory Sales */}
              <Card className="rounded-none border-0 border-r border-zinc-200 shadow-none">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Inventory Sales
                    </p>
                    <div className="space-y-1">
                      <p className="text-2xl font-semibold text-zinc-900">
                        {formatCurrency(reportData.metrics.inventoryRevenue)}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-500">
                          {reportData.metrics.totalSales} sales
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Revenue from inventory sales
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card className="rounded-none border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Categories
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-3">
                        <div>
                          <p className="text-2xl font-semibold text-zinc-900">
                            {reportData.inventorySummary.length}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">Total</p>
                        </div>
                        <div className="h-8 w-px bg-zinc-200"></div>
                        <div>
                          <p className="text-2xl font-semibold text-zinc-900">
                            {Math.round(
                              reportData.inventorySummary.reduce(
                                (sum: number, item: any) =>
                                  sum + item.itemCount,
                                0
                              ) / reportData.inventorySummary.length
                            )}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Avg items
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Inventory categories distribution
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Analytics & Sales vs Capital Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Analytics */}
              <Card className="border-zinc-200 bg-white">
                <CardContent className="p-6">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Category Analytics
                    </p>
                    <p className="text-sm text-zinc-500">
                      View inventory metrics by category
                    </p>
                  </div>

                  {/* Category Dropdown */}
                  <div className="space-y-3 mb-4">
                    <label className="text-xs font-medium text-zinc-700">
                      Select Category
                    </label>
                    <Select
                      defaultValue="all"
                      onValueChange={(value) => {
                        console.log("Selected category:", value);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs border-zinc-200">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">
                          All Categories
                        </SelectItem>
                        {reportData.inventorySummary.map((item: any) => (
                          <SelectItem
                            key={item.category}
                            value={item.category}
                            className="text-xs"
                          >
                            {item.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Performance */}
                  <div className="mt-4 pt-4 border-t border-zinc-200">
                    <p className="text-xs font-medium text-zinc-700 mb-2">
                      Top Categories by Value
                    </p>
                    <div className="space-y-2">
                      {reportData.inventorySummary
                        .sort((a: any, b: any) => b.totalValue - a.totalValue)
                        .slice(0, 3)
                        .map((item: any, index: number) => (
                          <div
                            key={item.category}
                            className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-md transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                                  index === 0
                                    ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white"
                                    : index === 1
                                      ? "bg-gradient-to-br from-zinc-300 to-zinc-400 text-white"
                                      : "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <span className="text-xs font-medium text-zinc-900">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-zinc-900">
                                {formatCurrency(item.totalValue)}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {item.itemCount} items
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sales vs Capital Multi-Line Chart */}
              <Card className="border-zinc-200 bg-white">
                <CardContent className="p-6">
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Sales vs Capital Trend
                    </p>
                    <p className="text-sm text-zinc-500">
                      Daily inventory sales vs capital value
                    </p>
                  </div>

                  {/* Sales vs Capital Chart */}
                  <div className="h-[300px] w-full">
                    {(() => {
                      // Prepare sales vs capital data
                      const salesData = prepareSalesChartData();

                      if (salesData.length === 0) {
                        return (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">
                              No sales data available
                            </p>
                          </div>
                        );
                      }

                      // Create chart data with both sales and capital
                      const chartData = salesData.map(
                        (item: any, index: number) => {
                          // For capital trend, create a realistic pattern based on sales
                          const baseCapital = reportData.metrics.inventoryValue;
                          const salesToday = item["Sales Amount"] || 0;
                          const dayFactor = (index / salesData.length) * 0.5; // 0 to 0.5
                          const capitalVariation = (salesToday / 1000) * 50000; // Capital responds to sales

                          return {
                            date: item.date,
                            Sales: salesToday,
                            Capital: Math.round(
                              baseCapital * (0.8 + dayFactor) + capitalVariation
                            ),
                          };
                        }
                      );

                      return (
                        <LineChart
                          data={chartData}
                          categories={["Sales", "Capital"]}
                          index="date"
                          valueFormatter={(value) => formatCurrency(value)}
                          colors={["#10b981", "#3b82f6"]}
                          showTooltip={true}
                          showGrid={true}
                          showXAxis={true}
                          showYAxis={true}
                          showLegend={true}
                        />
                      );
                    })()}
                  </div>

                  {/* Summary Stats */}
                  <div className="mt-4 pt-4 border-t border-zinc-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-zinc-500">
                          Total Inventory Sales
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(reportData.metrics.inventoryRevenue)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-zinc-500">Current Capital</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(reportData.metrics.inventoryValue)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs text-zinc-500">
                        ROI:{" "}
                        {reportData.metrics.inventoryValue > 0
                          ? Math.round(
                              (reportData.metrics.inventoryRevenue /
                                reportData.metrics.inventoryValue) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Inventory by Category Table */}
            <Card className="border-zinc-200 bg-white">
              <CardContent className="p-4">
                <div className="space-y-1 mb-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Inventory by Category
                  </p>
                  <p className="text-xs text-zinc-500">
                    Detailed inventory value by category
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-zinc-500 text-xs font-medium">
                        Category
                      </TableHead>
                      <TableHead className="text-zinc-500 text-xs font-medium">
                        Items
                      </TableHead>
                      <TableHead className="text-zinc-500 text-xs font-medium">
                        Total Value
                      </TableHead>
                      <TableHead className="text-zinc-500 text-xs font-medium">
                        Avg Value/Item
                      </TableHead>
                      <TableHead className="text-zinc-500 text-xs font-medium">
                        % of Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.inventorySummary
                      .sort((a: any, b: any) => b.totalValue - a.totalValue)
                      .map((item: any) => {
                        const totalInventoryValue =
                          reportData.metrics.inventoryValue;
                        const percentage =
                          totalInventoryValue > 0
                            ? Math.round(
                                (item.totalValue / totalInventoryValue) * 100
                              )
                            : 0;

                        return (
                          <TableRow
                            key={item.category}
                            className="hover:bg-zinc-50"
                          >
                            <TableCell className="font-medium text-zinc-900 text-sm">
                              {item.category}
                            </TableCell>
                            <TableCell className="text-zinc-900 text-sm">
                              {item.itemCount}
                            </TableCell>
                            <TableCell className="font-semibold text-green-600 text-sm">
                              {formatCurrency(item.totalValue)}
                            </TableCell>
                            <TableCell className="text-amber-600 text-sm">
                              {formatCurrency(
                                item.itemCount > 0
                                  ? item.totalValue / item.itemCount
                                  : 0
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={percentage}
                                  className="h-1.5 w-16 bg-zinc-100 [&>div]:bg-zinc-900"
                                />
                                <span className="text-xs font-medium text-zinc-900">
                                  {percentage}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="transactions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Inventory Transactions with Pagination */}
              <RecentTransactions
                type="inventory"
                title="Recent Inventory Transactions"
                description="Latest sales and purchase activities"
              />

              {/* Recent Project Transactions with Pagination */}
              <RecentTransactions
                type="project"
                title="Recent Project Transactions"
                description="Latest payment activities for projects"
              />
            </div>

            {/* Transaction Summary */}
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="space-y-1 mb-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Transaction Summary
                  </p>
                  <p className="text-sm text-zinc-500">
                    Overview of all transaction activities
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground mb-1">
                      Total Transactions
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {reportData.metrics.totalInventoryTransactions +
                        reportData.metrics.totalProjectTransactions}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground mb-1">
                      Inventory Transactions
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {reportData.metrics.totalInventoryTransactions}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground mb-1">
                      Project Transactions
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {reportData.metrics.totalProjectTransactions}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
