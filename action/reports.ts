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
  // Remove the recent transactions arrays from here since we'll fetch them separately
}

export async function generateReport(
  filters: ReportFilters = {}
): Promise<ReportData> {
  await dbConnect();

  const now = new Date();
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEndDate = now;

  const startDate = filters.startDate || defaultStartDate;
  const endDate = filters.endDate || defaultEndDate;

  // Get all data in parallel for better performance
  const [projects, projectTransactions, inventoryTransactions, inventoryItems] =
    await Promise.all([
      // Projects
      ProjectModel.find({
        createdAt: { $gte: startDate, $lte: endDate },
      }).lean(),

      // Project transactions
      Transaction.find({
        created_at: { $gte: startDate, $lte: endDate },
      }).lean(),

      // Inventory transactions (sales)
      InventoryTransaction.find({
        transactionDate: { $gte: startDate, $lte: endDate },
      }).lean(),

      // Inventory items
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

  // Calculate inventory value
  const inventoryValue = inventoryItems.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  );

  // Low stock items
  const lowStockItems = inventoryItems.filter(
    (item) => item.quantity <= item.reorderPoint
  ).length;

  // Generate data for charts
  const revenueTrend = generateRevenueTrendData(
    inventoryTransactions,
    projectTransactions,
    startDate,
    endDate
  );
  const projectStatus = generateProjectStatusData(projects);
  const inventorySummary = generateInventorySummary(inventoryItems);
  const salesData = generateSalesData(
    inventoryTransactions,
    startDate,
    endDate
  );
  const topInventoryItems = getTopInventoryItems(
    completedInventoryTransactions,
    inventoryItems
  );

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
    },
    revenueTrend,
    projectStatus,
    inventorySummary,
    salesData,
    topInventoryItems,
  };
}

// New function to get recent transactions with pagination
export async function getRecentTransactions(
  request: RecentTransactionsRequest = {}
): Promise<RecentTransactionsResponse> {
  await dbConnect();

  const page = request.page || 1;
  const limit = request.limit || 5;
  const skip = (page - 1) * limit;

  let transactions = [];
  let total = 0;

  if (request.type === "project") {
    total = await Transaction.countDocuments();
    const rawTransactions = await Transaction.find()
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
    total = await InventoryTransaction.countDocuments();
    const rawTransactions = await InventoryTransaction.find()
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

// Keep existing helper functions unchanged...
function generateRevenueTrendData(
  inventoryTransactions: any[],
  projectTransactions: any[],
  startDate: Date,
  endDate: Date
): RevenueData[] {
  const data: RevenueData[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];

    // Inventory transactions
    const dayInventoryTransactions = inventoryTransactions.filter(
      (t) => new Date(t.transactionDate).toISOString().split("T")[0] === dateStr
    );

    const inventoryRevenue = dayInventoryTransactions
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.totalAmount, 0);

    // Project transactions
    const dayProjectTransactions = projectTransactions.filter(
      (t) => new Date(t.created_at).toISOString().split("T")[0] === dateStr
    );

    const projectRevenue = dayProjectTransactions
      .filter((t) => t.status === "paid")
      .reduce((sum, t) => sum + t.amount, 0);

    data.push({
      date: dateStr,
      inventoryRevenue,
      projectRevenue,
      totalRevenue: inventoryRevenue + projectRevenue,
      inventoryTransactions: dayInventoryTransactions.filter(
        (t) => t.status === "completed"
      ).length,
      projectTransactions: dayProjectTransactions.filter(
        (t) => t.status === "paid"
      ).length,
    });

    current.setDate(current.getDate() + 1);
  }

  return data;
}

function generateSalesData(
  transactions: any[],
  startDate: Date,
  endDate: Date
): SalesData[] {
  const salesByDate: Record<string, { sales: number; quantity: number }> = {};

  transactions
    .filter((t) => t.status === "completed")
    .forEach((transaction) => {
      const date = new Date(transaction.transactionDate)
        .toISOString()
        .split("T")[0];

      if (!salesByDate[date]) {
        salesByDate[date] = { sales: 0, quantity: 0 };
      }

      salesByDate[date].sales += transaction.totalAmount;
      salesByDate[date].quantity += transaction.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );
    });

  // Fill in missing dates
  const data: SalesData[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    const daySales = salesByDate[dateStr] || { sales: 0, quantity: 0 };

    data.push({
      date: dateStr,
      inventorySales: daySales.sales,
      quantity: daySales.quantity,
    });

    current.setDate(current.getDate() + 1);
  }

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

export async function exportReportToCSV(
  filters: ReportFilters = {}
): Promise<string> {
  const report = await generateReport(filters);

  // Create CSV content
  let csv = "Metric,Value\n";

  // Add metrics
  csv += `Total Projects,${report.metrics.totalProjects}\n`;
  csv += `Active Projects,${report.metrics.activeProjects}\n`;
  csv += `Completed Projects,${report.metrics.completedProjects}\n`;
  csv += `Total Revenue,${report.metrics.totalRevenue}\n`;
  csv += `Inventory Revenue,${report.metrics.inventoryRevenue}\n`;
  csv += `Project Revenue,${report.metrics.projectRevenue}\n`;
  csv += `Inventory Value,${report.metrics.inventoryValue}\n`;
  csv += `Low Stock Items,${report.metrics.lowStockItems}\n`;
  csv += `Total Sales,${report.metrics.totalSales}\n`;
  csv += `Average Sale Value,${report.metrics.averageSaleValue}\n`;
  csv += `Inventory Transactions,${report.metrics.totalInventoryTransactions}\n`;
  csv += `Project Transactions,${report.metrics.totalProjectTransactions}\n\n`;

  // Add revenue trend
  csv +=
    "Date,Total Revenue,Inventory Revenue,Project Revenue,Inventory Transactions,Project Transactions\n";
  report.revenueTrend.forEach((row) => {
    csv += `${row.date},${row.totalRevenue},${row.inventoryRevenue},${row.projectRevenue},${row.inventoryTransactions},${row.projectTransactions}\n`;
  });

  csv += "\n";

  // Add top inventory items
  csv += "Rank,Product Name,Category,Sales,Quantity,Profit,Profit Margin\n";
  report.topInventoryItems.forEach((item, index) => {
    csv += `${index + 1},${item.name},${item.category},${item.sales},${item.quantity},${item.profit},${item.profitMargin}%\n`;
  });

  return csv;
}
