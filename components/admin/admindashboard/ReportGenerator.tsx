"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Download,
  FileText,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Building2,
  Calendar,
  BarChart3,
  PackageOpen,
  TrendingDown,
  TrendingUp as UpTrend,
} from "lucide-react";
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

export default function ReportGenerator() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any>(null);

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

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

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

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Loading Report...</CardTitle>
        </CardHeader>
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
        <CardHeader>
          <CardTitle className="text-foreground">Report Generator</CardTitle>
          <CardDescription className="text-muted-foreground">
            Generate comprehensive reports for your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
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

      {/* Metrics Overview */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue Card */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {formatCurrency(reportData.metrics.totalRevenue)}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Inventory:{" "}
                  {formatCurrency(reportData.metrics.inventoryRevenue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Projects: {formatCurrency(reportData.metrics.projectRevenue)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Card */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Projects
              </CardTitle>
              <Building2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {reportData.metrics.totalProjects}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs">
                  <div className="text-muted-foreground">Active</div>
                  <div className="font-medium text-foreground">
                    {reportData.metrics.activeProjects}
                  </div>
                </div>
                <div className="text-xs">
                  <div className="text-muted-foreground">Completed</div>
                  <div className="font-medium text-foreground">
                    {reportData.metrics.completedProjects}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Card */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Inventory
              </CardTitle>
              <Package className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {formatCurrency(reportData.metrics.inventoryValue)}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Low Stock:{" "}
                  <span
                    className={`font-medium ${reportData.metrics.lowStockItems > 0 ? "text-amber-600" : "text-foreground"}`}
                  >
                    {reportData.metrics.lowStockItems} items
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Sales:{" "}
                  <span className="font-medium text-foreground">
                    {reportData.metrics.totalSales}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Performance Card */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Sales Performance
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground mb-1">
                {formatCurrency(reportData.metrics.averageSaleValue)}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Avg. Sale Value
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Transactions:{" "}
                  <span className="font-medium text-foreground">
                    {reportData.metrics.totalInventoryTransactions}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Project TX:{" "}
                  <span className="font-medium text-foreground">
                    {reportData.metrics.totalProjectTransactions}
                  </span>
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
              {/* Revenue Breakdown - Matching overview dashboard style */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Revenue Trend
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    30-day revenue performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Sales Performance
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Inventory sales amount over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <SalesTrendChart data={prepareSalesChartData()} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Items */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Top 5 Inventory Items by Sales
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Best performing items by revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <CompactBarChart
                      data={prepareTopItemsChartData()}
                      categories={["Sales"]}
                      index="name"
                      valueFormatter={(value: number) => formatCurrency(value)}
                      colors={[DEFAULT_CHART_COLORS[0]]}
                      compact={true}
                      barSize={25}
                      className="w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Project Status Distribution */}
              <Card className="border-border bg-card flex flex-col">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Project Status
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Distribution of projects by status
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
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
              <CardHeader>
                <CardTitle className="text-foreground">
                  Revenue Breakdown
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Separated by inventory sales and project payments
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Revenue Composition
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Percentage breakdown of total revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Revenue Metrics
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Key performance indicators
                  </CardDescription>
                </CardHeader>
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
                        <UpTrend className="h-4 w-4 mr-1" />
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
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Sales Trend</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Daily inventory sales revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <SalesTrendChart data={prepareSalesChartData()} />
                  </div>
                </CardContent>
              </Card>

              {/* Quantity Sold */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Quantity Sold (Last 14 Days)
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Number of items sold per day
                  </CardDescription>
                </CardHeader>
                <CardContent>
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

            {/* Top 5 Inventory Items Table */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Top 5 Best Performing Items
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Inventory items with highest sales revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">Rank</TableHead>
                      <TableHead className="text-foreground">
                        Item Name
                      </TableHead>
                      <TableHead className="text-foreground">
                        Category
                      </TableHead>
                      <TableHead className="text-foreground">
                        Quantity Sold
                      </TableHead>
                      <TableHead className="text-foreground">
                        Sales Revenue
                      </TableHead>
                      <TableHead className="text-foreground">Profit</TableHead>
                      <TableHead className="text-foreground">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.topInventoryItems.map(
                      (item: any, index: number) => (
                        <TableRow
                          key={item.name}
                          className="hover:bg-accent/50"
                        >
                          <TableCell>
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-foreground font-bold">
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {item.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-border text-muted-foreground"
                            >
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="font-bold text-foreground">
                            {formatCurrency(item.sales)}
                          </TableCell>
                          <TableCell
                            className={
                              item.profit >= 0
                                ? "text-foreground"
                                : "text-destructive"
                            }
                          >
                            {formatCurrency(item.profit)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.profitMargin >= 30
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {item.profitMargin}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Status Distribution */}
              <Card className="border-border bg-card flex flex-col">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Project Status
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Current status of all projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
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
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Project Analytics
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Key project metrics and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inventory Value by Category */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Inventory Value by Category
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Total value of inventory across categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <CompactBarChart
                      data={prepareInventoryValueChartData()}
                      categories={["Total Value"]}
                      index="category"
                      valueFormatter={(value: number) => formatCurrency(value)}
                      colors={[DEFAULT_CHART_COLORS[0]]}
                      compact={true}
                      barSize={30}
                      className="w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Item Count by Category */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Item Count by Category
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Number of items in each category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <CompactBarChart
                      data={prepareInventoryValueChartData()}
                      categories={["Item Count"]}
                      index="category"
                      valueFormatter={(value: number) => value.toString()}
                      colors={[DEFAULT_CHART_COLORS[2]]}
                      compact={true}
                      barSize={30}
                      className="w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Summary Table */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Inventory Summary
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Detailed inventory metrics by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">
                        Category
                      </TableHead>
                      <TableHead className="text-foreground">Items</TableHead>
                      <TableHead className="text-foreground">
                        Low Stock
                      </TableHead>
                      <TableHead className="text-foreground">
                        Total Value
                      </TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.inventorySummary.map((item: any) => (
                      <TableRow
                        key={item.category}
                        className="hover:bg-accent/50"
                      >
                        <TableCell className="font-medium text-foreground">
                          {item.category}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {item.itemCount}
                        </TableCell>
                        <TableCell>
                          {item.lowStockCount > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              {item.lowStockCount} items
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {formatCurrency(item.totalValue)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.lowStockCount > 0 ? "destructive" : "outline"
                            }
                            className="text-xs"
                          >
                            {item.lowStockCount > 0 ? "Low Stock" : "Good"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
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
              <CardHeader>
                <CardTitle className="text-foreground">
                  Transaction Summary
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Overview of all transaction activities
                </CardDescription>
              </CardHeader>
              <CardContent>
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
