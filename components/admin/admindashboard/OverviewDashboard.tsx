"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { format } from "date-fns";
import { generateReport, type ReportFilters } from "@/action/reports";
import { OverviewDashboardSkeleton } from "@/components/admin/admindashboard/skeleton/OverviewDashboardSkeleton";
import { getInventories } from "@/action/inventory"; // Import inventory action

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

interface InventoryItem {
  product_id: string;
  name: string;
  quantity: number;
  unitCost: number;
  salePrice?: number;
  totalCapital: number;
  totalValue: number;
}

export function OverviewDashboard({
  startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  endDate = new Date(),
}: OverviewDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);

  // Pagination state for Inventory Capital Breakdown
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Show 5 categories per page

  // Memoize dates to prevent infinite re-renders
  const memoizedStartDate = useMemo(
    () => startDate,
    [startDate.getFullYear(), startDate.getMonth(), startDate.getDate()]
  );

  const memoizedEndDate = useMemo(
    () => endDate,
    [endDate.getFullYear(), endDate.getMonth(), endDate.getDate()]
  );

  // Function to fetch inventory data
  const loadInventoryData = useCallback(async () => {
    try {
      const inventories = await getInventories();
      // Transform inventory data to include calculated fields
      const formattedInventory: InventoryItem[] = inventories.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        salePrice: item.salePrice,
        totalCapital: item.totalCapital || item.quantity * item.unitCost,
        totalValue: item.totalValue || (item.salePrice || 0) * item.quantity,
      }));
      setInventoryData(formattedInventory);
    } catch (error) {
      console.error("Failed to load inventory data:", error);
      setInventoryData([]);
    }
  }, []);

  // Calculate total capital from inventory
  const calculateTotalInventoryCapital = useCallback((): number => {
    return inventoryData.reduce((total, item) => total + item.totalCapital, 0);
  }, [inventoryData]);

  // Calculate total inventory value (sale price)
  const calculateTotalInventoryValue = useCallback((): number => {
    return inventoryData.reduce((total, item) => total + item.totalValue, 0);
  }, [inventoryData]);

  const loadOverviewData = useCallback(async () => {
    setLoading(true);
    try {
      // Load data in parallel
      await Promise.all([
        (async () => {
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
        })(),
        loadInventoryData(),
      ]);
    } catch (error) {
      console.error("Failed to load overview data:", error);
    } finally {
      setLoading(false);
    }
  }, [memoizedStartDate, memoizedEndDate, loadInventoryData]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // Format currency
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

  // Safe formatting functions
  const safeFormatNumber = (num: number | undefined) => {
    return (num || 0).toLocaleString();
  };

  // Calculate total project sale (revenue from projects)
  const calculateTotalProjectSale = (): number => {
    return overviewData?.metrics?.projectRevenue || 0;
  };

  // Calculate total inventory capital
  const calculateTotalInventoryCapitalMemo = useMemo(() => {
    return calculateTotalInventoryCapital();
  }, [calculateTotalInventoryCapital]);

  // Calculate total inventory value
  const calculateTotalInventoryValueMemo = useMemo(() => {
    return calculateTotalInventoryValue();
  }, [calculateTotalInventoryValue]);

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

  // Calculate grouped inventory categories with pagination
  const calculateGroupedInventory = useCallback(() => {
    if (inventoryData.length === 0)
      return { categories: [], totalCategories: 0 };

    // Group inventory by category
    const categories = inventoryData.reduce(
      (
        acc: Record<
          string,
          {
            totalCapital: number;
            count: number;
            items: InventoryItem[];
          }
        >,
        item
      ) => {
        const category = item.name.split(" ")[0] || "Other"; // Simple category extraction
        if (!acc[category]) {
          acc[category] = {
            totalCapital: 0,
            count: 0,
            items: [],
          };
        }
        acc[category].totalCapital += item.totalCapital;
        acc[category].count += 1;
        acc[category].items.push(item);
        return acc;
      },
      {}
    );

    const sortedCategories = Object.entries(categories).sort(
      (a, b) => b[1].totalCapital - a[1].totalCapital
    );

    // Calculate pagination
    const totalCategories = sortedCategories.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCategories = sortedCategories.slice(startIndex, endIndex);

    return {
      categories: paginatedCategories,
      totalCategories,
      totalPages: Math.ceil(totalCategories / itemsPerPage),
    };
  }, [inventoryData, currentPage, itemsPerPage]);

  // Pagination handlers
  const nextPage = () => {
    const groupedData = calculateGroupedInventory();
    if (
      groupedData.totalPages !== undefined &&
      currentPage < groupedData.totalPages
    ) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Show skeleton loading state
  if (loading) {
    return <OverviewDashboardSkeleton />;
  }

  const revenueData = prepareRevenueTrendData();
  const projectStatusData = prepareProjectStatusData();
  const recentTransactions = getRecentTransactions();

  // Calculate total projects for percentage
  const totalProjects = projectStatusData.reduce(
    (sum: number, p: ProjectStatusItem) => sum + p.value,
    0
  );

  // Calculate stats
  const totalProjectSale = calculateTotalProjectSale();
  const totalInventoryCapital = calculateTotalInventoryCapitalMemo;
  const totalInventoryValue = calculateTotalInventoryValueMemo;

  // Get grouped inventory data
  const groupedInventory = calculateGroupedInventory();

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

      {/* Statistics Cards Grid - Seamless 2x3 Layout (2 rows, 3 columns) */}
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
                  {formatCurrency(overviewData?.metrics?.totalRevenue || 0)}
                </p>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs ${comparisonData?.metrics?.totalRevenue ? (calculateChange(overviewData?.metrics?.totalRevenue || 0, comparisonData?.metrics?.totalRevenue || 0).isPositive ? "text-green-600" : "text-red-600") : "text-zinc-500"}`}
                  >
                    {comparisonData?.metrics?.totalRevenue
                      ? `${calculateChange(overviewData?.metrics?.totalRevenue || 0, comparisonData?.metrics?.totalRevenue || 0).isPositive ? "+" : "-"}${calculateChange(overviewData?.metrics?.totalRevenue || 0, comparisonData?.metrics?.totalRevenue || 0).value}%`
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

        {/* Total Project Sale */}
        <Card className="rounded-none border-0 shadow-none border-b">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Project Sales
              </p>
              <div className="space-y-1">
                <p className="text-2xl font-semibold text-zinc-900">
                  {formatCurrency(totalProjectSale)}
                </p>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs ${comparisonData?.metrics?.projectRevenue ? (calculateChange(totalProjectSale, comparisonData?.metrics?.projectRevenue || 0).isPositive ? "text-green-600" : "text-red-600") : "text-zinc-500"}`}
                  >
                    {comparisonData?.metrics?.projectRevenue
                      ? `${calculateChange(totalProjectSale, comparisonData?.metrics?.projectRevenue || 0).isPositive ? "+" : "-"}${calculateChange(totalProjectSale, comparisonData?.metrics?.projectRevenue || 0).value}%`
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
                  {formatCurrency(overviewData?.metrics?.inventoryRevenue || 0)}
                </p>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs ${comparisonData?.metrics?.inventoryRevenue ? (calculateChange(overviewData?.metrics?.inventoryRevenue || 0, comparisonData?.metrics?.inventoryRevenue || 0).isPositive ? "text-green-600" : "text-red-600") : "text-zinc-500"}`}
                  >
                    {comparisonData?.metrics?.inventoryRevenue
                      ? `${calculateChange(overviewData?.metrics?.inventoryRevenue || 0, comparisonData?.metrics?.inventoryRevenue || 0).isPositive ? "+" : "-"}${calculateChange(overviewData?.metrics?.inventoryRevenue || 0, comparisonData?.metrics?.inventoryRevenue || 0).value}%`
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

        {/* Inventory Capital */}
        <Card className="rounded-none border-0 border-b shadow-none">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Inventory Capital
              </p>
              <div className="space-y-1">
                <p className="text-2xl font-semibold text-red-500">
                  {formatCurrency(totalInventoryCapital)}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500">
                    {inventoryData.length} items
                  </span>
                  <span className="text-xs text-zinc-500">
                    <span> • Value: </span>{" "}
                    <span className="text-green-600">
                      {" "}
                      {formatCurrency(totalInventoryValue)}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Total capital invested in inventory
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card className="rounded-none border-0 border-b shadow-none">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Active Projects
              </p>
              <div className="space-y-1">
                <p className="text-2xl font-semibold text-zinc-900">
                  {safeFormatNumber(overviewData?.metrics?.activeProjects)}
                </p>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs ${comparisonData?.metrics?.activeProjects ? (calculateChange(overviewData?.metrics?.activeProjects || 0, comparisonData?.metrics?.activeProjects || 0).isPositive ? "text-green-600" : "text-red-600") : "text-zinc-500"}`}
                  >
                    {comparisonData?.metrics?.activeProjects
                      ? `${calculateChange(overviewData?.metrics?.activeProjects || 0, comparisonData?.metrics?.activeProjects || 0).isPositive ? "+" : "-"}${calculateChange(overviewData?.metrics?.activeProjects || 0, comparisonData?.metrics?.activeProjects || 0).value}%`
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
        <Card className="rounded-none border-0 border-b border-l shadow-none">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Stock Status
              </p>
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <div>
                    <p className="text-2xl font-semibold text-zinc-900">
                      {safeFormatNumber(overviewData?.metrics?.lowStockItems)}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">Low stock</p>
                  </div>
                  <div className="h-8 w-px bg-zinc-200"></div>
                  <div>
                    <p className="text-2xl font-semibold text-zinc-900">
                      {safeFormatNumber(inventoryData.length)}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">Total items</p>
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

      {/* Main Content Grid - 2x2 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-0 overflow-hidden">
        {/* Row 1, Column 1: Revenue Trend */}
        <div className="border-r border-border border-b">
          <div className="p-6 h-full flex flex-col">
            <div className="space-y-1 mb-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Revenue Trend
              </p>
              <p className="text-sm text-zinc-500">
                14-day revenue performance
              </p>
            </div>
            <div className="flex-1 min-h-0">
              {revenueData.length > 0 ? (
                <div className="h-full w-full">
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
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    No revenue data available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 1, Column 2: Project Status Distribution */}
        <div className="border-b border-border">
          <div className="p-6 h-full flex flex-col">
            <div className="space-y-1 mb-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Project Status
              </p>
              <p className="text-sm text-zinc-500">
                Distribution of projects by status
              </p>
            </div>
            <div className="flex-1 min-h-0">
              {projectStatusData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  <div className="space-y-3 overflow-y-auto max-h-full pr-2">
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
                    <div className="relative w-40 h-40">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">
                            {overviewData?.metrics?.totalProjects || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Projects
                          </div>
                        </div>
                      </div>
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
                                  r="45%"
                                  fill="transparent"
                                  stroke={DEFAULT_CHART_COLORS[index]}
                                  strokeWidth="12"
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
          </div>
        </div>

        {/* Row 2, Column 1: Inventory Capital Breakdown */}
        <div className="border-r border-border">
          <div className="p-6 h-full flex flex-col">
            <div className="space-y-1 mb-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Inventory Capital Breakdown
              </p>
              <p className="text-sm text-zinc-500">
                Total capital invested by category
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {inventoryData.length > 0 ? (
                <div className="h-full flex flex-col">
                  {/* Categories List */}
                  <div className="flex-1 space-y-3">
                    {groupedInventory.categories.map(
                      ([category, data], index) => (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-foreground">
                              {category}
                            </span>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-foreground">
                                {formatCurrency(data.totalCapital)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {data.count} items
                              </p>
                            </div>
                          </div>
                          <Progress
                            value={
                              (data.totalCapital / totalInventoryCapital) * 100
                            }
                            className="h-2"
                          />
                        </div>
                      )
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {groupedInventory.totalCategories > itemsPerPage && (
                    <div className="pt-4 border-t border-border mt-4">
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(
                            currentPage * itemsPerPage,
                            groupedInventory.totalCategories
                          )}{" "}
                          of {groupedInventory.totalCategories} categories
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={prevPage}
                            disabled={currentPage === 1}
                            className={`p-1.5 rounded-md ${
                              currentPage === 1
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <div className="text-xs font-medium">
                            Page {currentPage} of {groupedInventory.totalPages}
                          </div>
                          <button
                            onClick={nextPage}
                            disabled={
                              currentPage === groupedInventory.totalPages
                            }
                            className={`p-1.5 rounded-md ${
                              currentPage === groupedInventory.totalPages
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Section */}
                  <div className="pt-4 border-t border-border mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-foreground">
                        Total Inventory Capital
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {formatCurrency(totalInventoryCapital)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        Total Items
                      </span>
                      <span className="text-sm text-foreground">
                        {inventoryData.length} items
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Average Capital per Item
                      </span>
                      <span className="text-sm text-foreground">
                        {formatCurrency(
                          inventoryData.length > 0
                            ? totalInventoryCapital / inventoryData.length
                            : 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    No inventory data available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2, Column 2: Revenue Distribution */}
        <div className="p-6 h-full flex flex-col">
          <div className="space-y-1 mb-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Revenue Distribution
            </p>
            <p className="text-sm text-zinc-500">
              Breakdown of revenue sources
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-4">
              {/* Project Revenue */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    Project Sales
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(totalProjectSale)}
                  </span>
                </div>
                <Progress
                  value={
                    overviewData?.metrics?.totalRevenue
                      ? (totalProjectSale / overviewData.metrics.totalRevenue) *
                        100
                      : 0
                  }
                  className="h-3"
                />
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    Percentage of total revenue
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {overviewData?.metrics?.totalRevenue
                      ? Math.round(
                          (totalProjectSale /
                            overviewData.metrics.totalRevenue) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* Inventory Sales */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    Inventory Sales
                  </span>
                  <span className="text-sm font-semibold text-foreground">
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
                  className="h-3"
                />
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    Percentage of total revenue
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {overviewData?.metrics?.totalRevenue
                      ? Math.round(
                          (overviewData.metrics.inventoryRevenue /
                            overviewData.metrics.totalRevenue) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* Capital vs Revenue Comparison */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    Capital Efficiency
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      totalInventoryCapital > 0 &&
                      overviewData?.metrics?.inventoryRevenue >
                        totalInventoryCapital
                        ? "bg-green-50 text-green-700 border-green-200"
                        : totalInventoryCapital > 0
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                    }
                  >
                    {totalInventoryCapital > 0
                      ? Math.round(
                          (overviewData?.metrics?.inventoryRevenue || 0) /
                            totalInventoryCapital
                        )
                      : 0}
                    x ROI
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Capital Invested
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(totalInventoryCapital)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Inventory Revenue
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(
                        overviewData?.metrics?.inventoryRevenue || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-medium text-foreground mb-2">
                  Performance Summary
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">
                      Total Revenue
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {formatCurrency(overviewData?.metrics?.totalRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">
                      Active Projects
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {overviewData?.metrics?.activeProjects || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">
                      Inventory Items
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {inventoryData.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
