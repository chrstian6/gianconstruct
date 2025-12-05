"use server";

import dbConnect from "@/lib/db";
import ProjectModel from "@/models/Project";
import InventoryTransaction from "@/models/InventoryTransactions";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transactions";

export type ReportPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  period?: ReportPeriod;
  projectId?: string;
  category?: string;
  status?: string;
}

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  inventoryRevenue: number;
  projectRevenue: number;
  inventoryValue: number;
  lowStockItems: number;
  totalSales: number;
  averageSaleValue: number;
  totalInventoryTransactions: number;
  totalProjectTransactions: number;
  currentDate: Date;
}

export interface RevenueData {
  date: string;
  inventoryRevenue: number;
  projectRevenue: number;
  totalRevenue: number;
  inventoryTransactions: number;
  projectTransactions: number;
}

export interface SalesData {
  date: string;
  inventorySales: number;
  quantity: number;
}

export interface ProjectStatusData {
  status: string;
  count: number;
  percentage: number;
}

export interface InventoryData {
  category: string;
  totalValue: number;
  itemCount: number;
  lowStockCount: number;
}

export interface TopInventoryItem {
  name: string;
  product_id: string;
  sales: number;
  quantity: number;
  category: string;
  profit: number;
  profitMargin: number;
}

export interface RecentTransactionsRequest {
  page?: number;
  limit?: number;
  type?: "inventory" | "project";
  startDate?: Date;
  endDate?: Date;
}

export interface RecentTransactionsResponse {
  transactions: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReportData {
  metrics: DashboardMetrics;
  revenueTrend: RevenueData[];
  projectStatus: ProjectStatusData[];
  inventorySummary: InventoryData[];
  salesData: SalesData[];
  topInventoryItems: TopInventoryItem[];
  filterSummary: {
    startDate: Date;
    endDate: Date;
    period: ReportPeriod | "custom";
  };
}

// Helper function to get date range based on period
function getDateRangeForPeriod(period: ReportPeriod = "monthly"): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "daily":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      startDate.setDate(endDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "monthly":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "quarterly":
      const quarter = Math.floor(endDate.getMonth() / 3);
      startDate.setMonth(quarter * 3);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "yearly":
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
}

export async function generateReport(
  filters: ReportFilters = {}
): Promise<ReportData> {
  await dbConnect();

  const now = new Date();

  // Determine date range
  let startDate: Date;
  let endDate: Date;

  if (filters.period && !filters.startDate && !filters.endDate) {
    // Use period-based date range
    const range = getDateRangeForPeriod(filters.period);
    startDate = range.startDate;
    endDate = range.endDate;
  } else {
    // Use custom date range or default to current month
    startDate =
      filters.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = filters.endDate || now;
  }

  // Ensure times are set correctly
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  // Build query filters dynamically
  const projectFilter: any = {};
  const projectTransactionFilter: any = {};
  const inventoryTransactionFilter: any = {};

  // Add date filters
  projectFilter.createdAt = { $gte: startDate, $lte: endDate };
  projectTransactionFilter.created_at = { $gte: startDate, $lte: endDate };
  inventoryTransactionFilter.transactionDate = {
    $gte: startDate,
    $lte: endDate,
  };

  // Add additional filters if provided
  if (filters.projectId) {
    projectFilter._id = filters.projectId;
    projectTransactionFilter.project_id = filters.projectId;
  }

  if (filters.status) {
    projectFilter.status = filters.status;
  }

  // Get all data in parallel for better performance
  const [projects, projectTransactions, inventoryTransactions, inventoryItems] =
    await Promise.all([
      // Projects with dynamic filters
      ProjectModel.find(projectFilter).lean(),

      // Project transactions with dynamic filters
      Transaction.find(projectTransactionFilter).lean(),

      // Inventory transactions (sales) with dynamic filters
      InventoryTransaction.find(inventoryTransactionFilter).lean(),

      // Inventory items (always get all for current inventory value)
      Inventory.find().lean(),
    ]);

  // Calculate project metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedProjects = projects.filter(
    (p) => p.status === "completed"
  ).length;

  // Calculate project transaction revenue
  const projectRevenue = projectTransactions
    .filter((t) => t.status === "paid")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalProjectTransactions = projectTransactions.length;

  // Calculate inventory sales revenue and get detailed data
  const completedInventoryTransactions = inventoryTransactions.filter(
    (t) => t.status === "completed"
  );

  const inventoryRevenue = completedInventoryTransactions.reduce(
    (sum, t) => sum + t.totalAmount,
    0
  );

  const totalRevenue = projectRevenue + inventoryRevenue;
  const totalInventoryTransactions = completedInventoryTransactions.length;
  const totalSales = totalInventoryTransactions;

  // Calculate average sale value
  const averageSaleValue =
    totalInventoryTransactions > 0
      ? inventoryRevenue / totalInventoryTransactions
      : 0;

  // Calculate inventory value (current inventory, not filtered by date)
  const inventoryValue = inventoryItems.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  );

  // Low stock items (current inventory)
  const lowStockItems = inventoryItems.filter(
    (item) => item.quantity <= item.reorderPoint
  ).length;

  // Generate data for charts
  const revenueTrend = generateRevenueTrendData(
    inventoryTransactions,
    projectTransactions,
    startDate,
    endDate,
    filters.period
  );
  const projectStatus = generateProjectStatusData(projects);
  const inventorySummary = generateInventorySummary(inventoryItems);
  const salesData = generateSalesData(
    inventoryTransactions,
    startDate,
    endDate,
    filters.period
  );
  const topInventoryItems = getTopInventoryItems(
    completedInventoryTransactions,
    inventoryItems
  );

  // Determine period label
  const periodLabel =
    filters.period ||
    (filters.startDate && filters.endDate ? "custom" : "monthly");

  return {
    metrics: {
      totalProjects,
      activeProjects,
      completedProjects,
      totalRevenue,
      inventoryRevenue,
      projectRevenue,
      inventoryValue,
      lowStockItems,
      totalSales,
      averageSaleValue,
      totalInventoryTransactions,
      totalProjectTransactions,
      currentDate: new Date(),
    },
    revenueTrend,
    projectStatus,
    inventorySummary,
    salesData,
    topInventoryItems,
    filterSummary: {
      startDate,
      endDate,
      period: periodLabel,
    },
  };
}

// New function to get recent transactions with pagination and date filtering
export async function getRecentTransactions(
  request: RecentTransactionsRequest = {}
): Promise<RecentTransactionsResponse> {
  await dbConnect();

  const page = request.page || 1;
  const limit = request.limit || 5;
  const skip = (page - 1) * limit;

  // Build date filter
  const dateFilter: any = {};
  if (request.startDate || request.endDate) {
    dateFilter.$and = [];
    if (request.startDate) {
      const start = new Date(request.startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.$and.push({ $gte: ["$$transactionDate", start] });
    }
    if (request.endDate) {
      const end = new Date(request.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$and.push({ $lte: ["$$transactionDate", end] });
    }
  }

  let transactions = [];
  let total = 0;

  if (request.type === "project") {
    // Build query for project transactions
    const query: any = {};
    if (request.startDate || request.endDate) {
      query.created_at = {};
      if (request.startDate) {
        const start = new Date(request.startDate);
        start.setHours(0, 0, 0, 0);
        query.created_at.$gte = start;
      }
      if (request.endDate) {
        const end = new Date(request.endDate);
        end.setHours(23, 59, 59, 999);
        query.created_at.$lte = end;
      }
    }

    total = await Transaction.countDocuments(query);
    const rawTransactions = await Transaction.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    transactions = rawTransactions.map((t) => ({
      transaction_id: t.transaction_id,
      project_id: t.project_id,
      amount: t.amount,
      status: t.status,
      due_date: t.due_date,
      type: t.type,
      user_id: t.user_id,
      created_at: t.created_at,
    }));
  } else {
    // Build query for inventory transactions
    const query: any = {};
    if (request.startDate || request.endDate) {
      query.transactionDate = {};
      if (request.startDate) {
        const start = new Date(request.startDate);
        start.setHours(0, 0, 0, 0);
        query.transactionDate.$gte = start;
      }
      if (request.endDate) {
        const end = new Date(request.endDate);
        end.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = end;
      }
    }

    total = await InventoryTransaction.countDocuments(query);
    const rawTransactions = await InventoryTransaction.find(query)
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    transactions = rawTransactions.map((t) => ({
      transaction_id: t.transaction_id,
      clientName: t.clientName,
      totalAmount: t.totalAmount,
      status: t.status,
      date: t.transactionDate,
      items: t.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      created_at: t.transactionDate,
    }));
  }

  const totalPages = Math.ceil(total / limit);

  return {
    transactions,
    total,
    page,
    limit,
    totalPages,
  };
}

// Helper function to determine date grouping based on period
function getDateGrouping(
  startDate: Date,
  endDate: Date,
  period?: ReportPeriod
): "day" | "week" | "month" | "quarter" | "year" {
  if (period) return period === "weekly" ? "week" : (period as any);

  const diffDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 31) return "day";
  if (diffDays <= 90) return "week";
  if (diffDays <= 365) return "month";
  return "quarter";
}

function generateRevenueTrendData(
  inventoryTransactions: any[],
  projectTransactions: any[],
  startDate: Date,
  endDate: Date,
  period?: ReportPeriod
): RevenueData[] {
  const data: RevenueData[] = [];
  const dateGrouping = getDateGrouping(startDate, endDate, period);

  // Group transactions by date based on grouping
  const groupedData: Record<
    string,
    {
      inventoryRevenue: number;
      projectRevenue: number;
      inventoryTransactions: number;
      projectTransactions: number;
    }
  > = {};

  // Helper function to get date key based on grouping
  const getDateKey = (date: Date): string => {
    switch (dateGrouping) {
      case "day":
        return date.toISOString().split("T")[0];
      case "week":
        const year = date.getFullYear();
        const week = Math.ceil(
          (date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7
        );
        return `${year}-W${week}`;
      case "month":
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      case "quarter":
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      case "year":
        return date.getFullYear().toString();
      default:
        return date.toISOString().split("T")[0];
    }
  };

  // Process inventory transactions
  inventoryTransactions
    .filter((t) => t.status === "completed")
    .forEach((t) => {
      const dateKey = getDateKey(new Date(t.transactionDate));
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          inventoryRevenue: 0,
          projectRevenue: 0,
          inventoryTransactions: 0,
          projectTransactions: 0,
        };
      }
      groupedData[dateKey].inventoryRevenue += t.totalAmount;
      groupedData[dateKey].inventoryTransactions += 1;
    });

  // Process project transactions
  projectTransactions
    .filter((t) => t.status === "paid")
    .forEach((t) => {
      const dateKey = getDateKey(new Date(t.created_at));
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          inventoryRevenue: 0,
          projectRevenue: 0,
          inventoryTransactions: 0,
          projectTransactions: 0,
        };
      }
      groupedData[dateKey].projectRevenue += t.amount;
      groupedData[dateKey].projectTransactions += 1;
    });

  // Generate all dates in range with proper grouping
  const current = new Date(startDate);
  const dateKeysSet = new Set<string>();

  while (current <= endDate) {
    dateKeysSet.add(getDateKey(new Date(current)));

    switch (dateGrouping) {
      case "day":
        current.setDate(current.getDate() + 1);
        break;
      case "week":
        current.setDate(current.getDate() + 7);
        break;
      case "month":
        current.setMonth(current.getMonth() + 1);
        break;
      case "quarter":
        current.setMonth(current.getMonth() + 3);
        break;
      case "year":
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  // Convert to array and sort
  const dateKeys = Array.from(dateKeysSet).sort();

  dateKeys.forEach((dateKey) => {
    const dayData = groupedData[dateKey] || {
      inventoryRevenue: 0,
      projectRevenue: 0,
      inventoryTransactions: 0,
      projectTransactions: 0,
    };

    data.push({
      date: dateKey,
      inventoryRevenue: dayData.inventoryRevenue,
      projectRevenue: dayData.projectRevenue,
      totalRevenue: dayData.inventoryRevenue + dayData.projectRevenue,
      inventoryTransactions: dayData.inventoryTransactions,
      projectTransactions: dayData.projectTransactions,
    });
  });

  return data;
}

function generateSalesData(
  transactions: any[],
  startDate: Date,
  endDate: Date,
  period?: ReportPeriod
): SalesData[] {
  const salesByDate: Record<string, { sales: number; quantity: number }> = {};
  const dateGrouping = getDateGrouping(startDate, endDate, period);

  // Helper function to get date key
  const getDateKey = (date: Date): string => {
    switch (dateGrouping) {
      case "day":
        return date.toISOString().split("T")[0];
      case "week":
        const year = date.getFullYear();
        const week = Math.ceil(
          (date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7
        );
        return `${year}-W${week}`;
      case "month":
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      case "quarter":
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      case "year":
        return date.getFullYear().toString();
      default:
        return date.toISOString().split("T")[0];
    }
  };

  transactions
    .filter((t) => t.status === "completed")
    .forEach((transaction) => {
      const date = getDateKey(new Date(transaction.transactionDate));

      if (!salesByDate[date]) {
        salesByDate[date] = { sales: 0, quantity: 0 };
      }

      salesByDate[date].sales += transaction.totalAmount;
      salesByDate[date].quantity += transaction.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );
    });

  // Generate all dates in range
  const data: SalesData[] = [];
  const current = new Date(startDate);
  const dateKeysSet = new Set<string>();

  while (current <= endDate) {
    dateKeysSet.add(getDateKey(new Date(current)));

    switch (dateGrouping) {
      case "day":
        current.setDate(current.getDate() + 1);
        break;
      case "week":
        current.setDate(current.getDate() + 7);
        break;
      case "month":
        current.setMonth(current.getMonth() + 1);
        break;
      case "quarter":
        current.setMonth(current.getMonth() + 3);
        break;
      case "year":
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  // Convert to array, sort, and create data
  const dateKeys = Array.from(dateKeysSet).sort();

  dateKeys.forEach((dateKey) => {
    const daySales = salesByDate[dateKey] || { sales: 0, quantity: 0 };

    data.push({
      date: dateKey,
      inventorySales: daySales.sales,
      quantity: daySales.quantity,
    });
  });

  return data;
}

function getTopInventoryItems(
  transactions: any[],
  inventoryItems: any[]
): TopInventoryItem[] {
  const productSales: Record<
    string,
    {
      sales: number;
      quantity: number;
      category: string;
      unitCost: number;
      salePrice: number;
    }
  > = {};

  // Initialize with inventory data
  inventoryItems.forEach((item) => {
    productSales[item.name] = {
      sales: 0,
      quantity: 0,
      category: item.category,
      unitCost: item.unitCost,
      salePrice: item.salePrice || 0,
    };
  });

  // Add sales data
  transactions.forEach((transaction) => {
    transaction.items.forEach((item: any) => {
      if (productSales[item.name]) {
        productSales[item.name].sales += item.totalPrice;
        productSales[item.name].quantity += item.quantity;
      }
    });
  });

  // Calculate profit and sort by sales
  return Object.entries(productSales)
    .filter(([_, data]) => data.sales > 0)
    .map(([name, data]) => {
      const cost = data.quantity * data.unitCost;
      const profit = data.sales - cost;
      const profitMargin = data.sales > 0 ? (profit / data.sales) * 100 : 0;

      return {
        name,
        product_id: name.toLowerCase().replace(/\s+/g, "-"),
        sales: data.sales,
        quantity: data.quantity,
        category: data.category,
        profit,
        profitMargin: Math.round(profitMargin),
      };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);
}

function generateProjectStatusData(projects: any[]): ProjectStatusData[] {
  const statusCounts: Record<string, number> = {};

  projects.forEach((project) => {
    statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
  });

  const total = projects.length;

  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

function generateInventorySummary(inventoryItems: any[]): InventoryData[] {
  const categories: Record<string, InventoryData> = {};

  inventoryItems.forEach((item) => {
    if (!categories[item.category]) {
      categories[item.category] = {
        category: item.category,
        totalValue: 0,
        itemCount: 0,
        lowStockCount: 0,
      };
    }

    categories[item.category].totalValue += item.quantity * item.unitCost;
    categories[item.category].itemCount += 1;

    if (item.quantity <= item.reorderPoint) {
      categories[item.category].lowStockCount += 1;
    }
  });

  return Object.values(categories);
}

// Get real-time dashboard metrics (for current day)
export async function getRealTimeMetrics(): Promise<DashboardMetrics> {
  await dbConnect();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  // Get data for today only
  const [
    projectsToday,
    projectTransactionsToday,
    inventoryTransactionsToday,
    inventoryItems,
  ] = await Promise.all([
    ProjectModel.find({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }).lean(),

    Transaction.find({
      created_at: { $gte: todayStart, $lte: todayEnd },
    }).lean(),

    InventoryTransaction.find({
      transactionDate: { $gte: todayStart, $lte: todayEnd },
    }).lean(),

    Inventory.find().lean(),
  ]);

  // Calculate metrics for today
  const totalProjects = projectsToday.length;
  const activeProjects = projectsToday.filter(
    (p) => p.status === "active"
  ).length;
  const completedProjects = projectsToday.filter(
    (p) => p.status === "completed"
  ).length;

  const projectRevenueToday = projectTransactionsToday
    .filter((t) => t.status === "paid")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalProjectTransactions = projectTransactionsToday.length;

  const completedInventoryTransactionsToday = inventoryTransactionsToday.filter(
    (t) => t.status === "completed"
  );

  const inventoryRevenueToday = completedInventoryTransactionsToday.reduce(
    (sum, t) => sum + t.totalAmount,
    0
  );

  const totalRevenueToday = projectRevenueToday + inventoryRevenueToday;
  const totalInventoryTransactions = completedInventoryTransactionsToday.length;
  const totalSales = totalInventoryTransactions;

  const averageSaleValue =
    totalInventoryTransactions > 0
      ? inventoryRevenueToday / totalInventoryTransactions
      : 0;

  const inventoryValue = inventoryItems.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  );

  const lowStockItems = inventoryItems.filter(
    (item) => item.quantity <= item.reorderPoint
  ).length;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalRevenue: totalRevenueToday,
    inventoryRevenue: inventoryRevenueToday,
    projectRevenue: projectRevenueToday,
    inventoryValue,
    lowStockItems,
    totalSales,
    averageSaleValue,
    totalInventoryTransactions,
    totalProjectTransactions,
    currentDate: now,
  };
}

export async function exportReportToCSV(
  filters: ReportFilters = {}
): Promise<string> {
  const report = await generateReport(filters);

  // Create CSV content
  let csv = `Report Period: ${report.filterSummary.period}\n`;
  csv += `Date Range: ${report.filterSummary.startDate.toISOString().split("T")[0]} to ${report.filterSummary.endDate.toISOString().split("T")[0]}\n`;
  csv += `Generated: ${new Date().toISOString()}\n\n`;

  // Add metrics
  csv += "Dashboard Metrics\n";
  csv += "Metric,Value\n";
  csv += `Total Projects,${report.metrics.totalProjects}\n`;
  csv += `Active Projects,${report.metrics.activeProjects}\n`;
  csv += `Completed Projects,${report.metrics.completedProjects}\n`;
  csv += `Total Revenue,$${report.metrics.totalRevenue.toFixed(2)}\n`;
  csv += `Inventory Revenue,$${report.metrics.inventoryRevenue.toFixed(2)}\n`;
  csv += `Project Revenue,$${report.metrics.projectRevenue.toFixed(2)}\n`;
  csv += `Inventory Value,$${report.metrics.inventoryValue.toFixed(2)}\n`;
  csv += `Low Stock Items,${report.metrics.lowStockItems}\n`;
  csv += `Total Sales,${report.metrics.totalSales}\n`;
  csv += `Average Sale Value,$${report.metrics.averageSaleValue.toFixed(2)}\n`;
  csv += `Inventory Transactions,${report.metrics.totalInventoryTransactions}\n`;
  csv += `Project Transactions,${report.metrics.totalProjectTransactions}\n\n`;

  // Add revenue trend
  csv += "Revenue Trend\n";
  csv +=
    "Date,Total Revenue,Inventory Revenue,Project Revenue,Inventory Transactions,Project Transactions\n";
  report.revenueTrend.forEach((row) => {
    csv += `${row.date},$${row.totalRevenue.toFixed(2)},$${row.inventoryRevenue.toFixed(2)},$${row.projectRevenue.toFixed(2)},${row.inventoryTransactions},${row.projectTransactions}\n`;
  });

  csv += "\n";

  // Add project status
  csv += "Project Status Distribution\n";
  csv += "Status,Count,Percentage\n";
  report.projectStatus.forEach((row) => {
    csv += `${row.status},${row.count},${row.percentage}%\n`;
  });

  csv += "\n";

  // Add inventory summary
  csv += "Inventory Summary by Category\n";
  csv += "Category,Total Value,Item Count,Low Stock Items\n";
  report.inventorySummary.forEach((row) => {
    csv += `${row.category},$${row.totalValue.toFixed(2)},${row.itemCount},${row.lowStockCount}\n`;
  });

  csv += "\n";

  // Add sales data
  csv += "Sales Data\n";
  csv += "Date,Sales Amount,Quantity Sold\n";
  report.salesData.forEach((row) => {
    csv += `${row.date},$${row.inventorySales.toFixed(2)},${row.quantity}\n`;
  });

  csv += "\n";

  // Add top inventory items
  csv += "Top Performing Inventory Items\n";
  csv += "Rank,Product Name,Category,Sales,Quantity,Profit,Profit Margin\n";
  report.topInventoryItems.forEach((item, index) => {
    csv += `${index + 1},${item.name},${item.category},$${item.sales.toFixed(2)},${item.quantity},$${item.profit.toFixed(2)},${item.profitMargin}%\n`;
  });

  return csv;
}

// Export data for specific date ranges
export async function exportDataByDateRange(
  startDate: Date,
  endDate: Date,
  dataType: "transactions" | "projects" | "inventory"
): Promise<any[]> {
  await dbConnect();

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (dataType) {
    case "transactions":
      const [projectTrans, inventoryTrans] = await Promise.all([
        Transaction.find({
          created_at: { $gte: start, $lte: end },
        }).lean(),
        InventoryTransaction.find({
          transactionDate: { $gte: start, $lte: end },
        }).lean(),
      ]);

      return [
        ...projectTrans.map((t) => ({ type: "project", ...t })),
        ...inventoryTrans.map((t) => ({ type: "inventory", ...t })),
      ];

    case "projects":
      return await ProjectModel.find({
        createdAt: { $gte: start, $lte: end },
      }).lean();

    case "inventory":
      // Get inventory items and their transactions within date range
      const inventoryItems = await Inventory.find().lean();
      const inventoryTransactions = await InventoryTransaction.find({
        transactionDate: { $gte: start, $lte: end },
        status: "completed",
      }).lean();

      return inventoryItems.map((item) => {
        const itemTransactions = inventoryTransactions.filter((t) =>
          t.items.some((i: any) => i.name === item.name)
        );

        const totalSold = itemTransactions.reduce((sum, t) => {
          const itemInTransaction = t.items.find(
            (i: any) => i.name === item.name
          );
          return sum + (itemInTransaction?.quantity || 0);
        }, 0);

        return {
          ...item,
          totalSold,
          lastSold: itemTransactions[0]?.transactionDate || null,
        };
      });

    default:
      return [];
  }
}
