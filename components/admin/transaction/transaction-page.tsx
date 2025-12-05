"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  Calendar,
  User,
  DollarSign,
  Hash,
  Package,
  Building2,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  CreditCard,
  FileText,
  Filter,
  TrendingUp,
  Layers,
} from "lucide-react";
import { InventoryPOS } from "@/components/admin/transaction/inventory-pos";
import { ReceiptHistory } from "@/components/admin/transaction/receipt-history";
import { toast } from "sonner";
import { PaymentData as POSPaymentData } from "@/types/payment";
import { InventoryPOSPayment } from "@/types/inventory-pos";
import {
  getInventoryPOSTransactions,
  getFullInventoryPOSTransaction,
  voidInventoryPOSTransaction,
} from "@/action/inventoryPOS";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AreaChart } from "@/components/ui/area-chart";
import { format } from "date-fns";
import { generateReport, type ReportFilters } from "@/action/reports";
import { TransactionHistory } from "@/components/admin/transaction/transaction-history";
import { ProjectTransactions } from "@/components/admin/transaction/project-transactions";
import { Skeleton } from "@/components/ui/skeleton";

export interface PaymentData {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  paymentType: "downpayment" | "monthly" | "cash" | "full";
  paymentMethod: "cash" | "card" | "bank_transfer" | "check";
  amount: number;
  designDetails: {
    name: string;
    price: number;
    squareMeters: number;
    isLoanOffer: boolean;
    loanDetails?: {
      interestRate: number;
      loanTerm: number;
      downPayment: number;
      monthlyPayment: number;
    };
  };
  transactionDate: string;
  dueDate?: string;
  referenceNumber: string;
  notes?: string;
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

const TABS = [
  "Overview",
  "Inventory PoS",
  "Project Transactions",
  "Receipt History",
];

const TAB_TO_SLUG: Record<string, string> = {
  Overview: "overview",
  "Inventory PoS": "inventory-pos",
  "Project Transactions": "project-transactions",
  "Receipt History": "receipt-history",
};

const SLUG_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_TO_SLUG).map(([tab, slug]) => [slug, tab])
);

// Monochromatic gradient colors
const MONOCHROMATIC_GRADIENTS = [
  "hsl(220, 70%, 50%)", // Primary Blue
  "hsl(220, 70%, 60%)", // Light Blue
  "hsl(220, 70%, 70%)", // Lighter Blue
  "hsl(220, 70%, 80%)", // Very Light Blue
];

const DEFAULT_CHART_COLORS = MONOCHROMATIC_GRADIENTS;

// Helper function to check if receipt is voided
const isVoided = (receipt: InventoryPOSPayment) => {
  return (
    receipt.status === "voided" ||
    (receipt.status === "failed" && receipt.notes?.includes("VOIDED"))
  );
};

export default function TransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [inventoryPaymentData, setInventoryPaymentData] =
    useState<InventoryPOSPayment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isLoading, setIsLoading] = useState(true);
  const [receipts, setReceipts] = useState<InventoryPOSPayment[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // Memoize dates to prevent infinite re-renders
  const memoizedStartDate = useMemo(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    []
  );

  const memoizedEndDate = useMemo(() => new Date(), []);

  // Load overview data
  const loadOverviewData = useCallback(async () => {
    setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  }, [memoizedStartDate, memoizedEndDate]);

  // Load receipts from database using existing action
  const loadReceipts = useCallback(async () => {
    setIsLoadingReceipts(true);
    try {
      const result = await getInventoryPOSTransactions(100, 0);
      if (result.success) {
        // Load full details for each transaction
        const receiptsWithDetails = await Promise.all(
          result.transactions.map(async (txn) => {
            const fullResult = await getFullInventoryPOSTransaction(txn.id);
            if (fullResult.success && fullResult.transaction) {
              return fullResult.transaction;
            }
            // Fallback to basic info if full details fail
            return {
              id: txn.id,
              referenceNumber: txn.referenceNumber,
              transactionDate: txn.transactionDate,
              clientInfo: {
                clientName: txn.clientName,
                clientEmail: txn.clientEmail || "",
                clientPhone: txn.clientPhone || "",
                clientAddress: "",
              },
              paymentMethod: txn.paymentMethod,
              paymentType: txn.paymentType,
              items: [],
              subtotal: txn.totalAmount,
              discountAmount: 0,
              discountPercentage: 0,
              taxAmount: 0,
              taxPercentage: 0,
              totalAmount: txn.totalAmount,
              amountPaid: txn.totalAmount,
              change: 0,
              status: txn.status,
            } as InventoryPOSPayment;
          })
        );
        setReceipts(receiptsWithDetails);
      } else {
        toast.error(result.error || "Failed to load receipts");
      }
    } catch (error) {
      toast.error("Error loading receipts");
      console.error("Error loading receipts:", error);
    } finally {
      setIsLoadingReceipts(false);
    }
  }, []);

  // Initialize from URL on mount only
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");

    let initialTab = "Overview";
    if (
      tabFromUrl &&
      SLUG_TO_TAB[tabFromUrl] &&
      SLUG_TO_TAB[tabFromUrl] !== "Overview"
    ) {
      initialTab = SLUG_TO_TAB[tabFromUrl];
    }

    setActiveTab(initialTab);
    const slug = TAB_TO_SLUG[initialTab];
    router.push(`?tab=${slug}`, { scroll: false });
    setIsLoading(false);
  }, []);

  // Load data when tab changes - SEPARATE FROM INIT
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;

      if (activeTab === "Overview") {
        await loadOverviewData();
      } else if (activeTab === "Receipt History") {
        await loadReceipts();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeTab, loadOverviewData, loadReceipts]);

  // Update URL and localStorage when tab changes
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      localStorage.setItem("transactionActiveTab", tab);
      const slug = TAB_TO_SLUG[tab];
      router.push(`?tab=${slug}`, { scroll: false });
    },
    [router]
  );

  const handlePaymentSubmit = (data: PaymentData) => {
    const newPaymentData = {
      ...data,
      id: `TRX-${Date.now()}`,
      referenceNumber: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      transactionDate: new Date().toISOString(),
    };

    setPaymentData(newPaymentData);
    toast.success("Payment processed successfully!");
  };

  const handlePOSPayment = (data: POSPaymentData) => {
    const convertedPaymentData: PaymentData = {
      id: data.id,
      clientName: `${data.userInfo.firstName} ${data.userInfo.lastName}`,
      clientEmail: data.userInfo.email,
      clientPhone: data.userInfo.contactNo,
      clientAddress: data.userInfo.address,
      paymentType: data.paymentType,
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      designDetails: {
        name: data.designDetails.name,
        price: data.designDetails.price,
        squareMeters: data.designDetails.squareMeters,
        isLoanOffer: data.designDetails.isLoanOffer,
        loanDetails: data.designDetails.loanDetails,
      },
      transactionDate: data.transactionDate,
      dueDate: data.dueDate,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
    };

    setPaymentData(convertedPaymentData);
    toast.success("POS Payment processed successfully!");
  };

  const handleInventoryPOSPayment = useCallback(
    (data: InventoryPOSPayment) => {
      setInventoryPaymentData(data);
      setReceipts((prev) => [data, ...prev]);
      loadOverviewData();
      toast.success("Inventory transaction completed successfully!");
    },
    [loadOverviewData]
  );

  const handlePrintReceipt = (receipt: InventoryPOSPayment) => {
    setIsGenerating(true);
    setTimeout(() => {
      console.log("Printing receipt:", receipt);
      window.print();
      setIsGenerating(false);
      toast.success("Receipt printed successfully!");
    }, 1000);
  };

  const handleVoidReceipt = useCallback(
    async (receiptId: string, reason: string, password: string) => {
      if (!password || password.trim() === "") {
        toast.error("Please enter a valid password");
        return;
      }

      const isValidPassword = password === "admin123";

      if (!isValidPassword) {
        toast.error("Invalid password");
        return;
      }

      if (
        confirm(
          `Are you sure you want to void receipt ${receiptId}? This action cannot be undone and will restore inventory quantities.\n\nReason: ${reason}`
        )
      ) {
        try {
          const result = await voidInventoryPOSTransaction(
            receiptId,
            reason.trim()
          );
          if (result.success) {
            setReceipts((prev) =>
              prev.map((receipt) =>
                receipt.id === receiptId
                  ? {
                      ...receipt,
                      status: "voided" as const,
                      notes: reason
                        ? `VOIDED: ${reason}`
                        : "VOIDED: No reason provided",
                    }
                  : receipt
              )
            );

            loadReceipts();
            loadOverviewData();

            toast.success(
              `Receipt voided successfully! Inventory quantities restored and ₱${result.transaction?.amountSubtracted?.toFixed(2) || "amount"} subtracted from total sales.`
            );
          } else {
            toast.error(result.error || "Failed to void receipt");
          }
        } catch (error: any) {
          console.error("Error voiding receipt:", error);
          toast.error("Error voiding receipt");
        }
      }
    },
    [loadReceipts, loadOverviewData]
  );

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      toast.success("PDF downloaded successfully!");
      setIsGenerating(false);
    }, 1000);
  };

  const refreshAllData = useCallback(() => {
    setIsRefreshing(true);
    loadOverviewData();
    loadReceipts();
    toast.success("Data refreshed successfully!");
  }, [loadOverviewData, loadReceipts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyDecimal = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateChange = useCallback((current: number, previous: number) => {
    if (previous === 0) return { value: 100, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change >= 0,
    };
  }, []);

  const getMetrics = useCallback((): MetricItem[] => {
    if (!overviewData?.metrics || !comparisonData?.metrics) return [];

    const metrics = overviewData.metrics;
    const prevMetrics = comparisonData.metrics;

    const totalReceiptRevenue = receipts
      .filter((r) => !isVoided(r))
      .reduce((sum, receipt) => sum + receipt.totalAmount, 0);

    const successfulReceipts = receipts.filter((r) => !isVoided(r)).length;
    const voidedReceipts = receipts.filter((r) => isVoided(r)).length;

    return [
      {
        title: "Total Revenue",
        value: formatCurrency(metrics.totalRevenue || 0),
        change: calculateChange(
          metrics.totalRevenue || 0,
          prevMetrics.totalRevenue || 0
        ),
        icon: DollarSign,
        description: "Combined revenue from all transactions",
        color: "text-foreground",
      },
      {
        title: "Inventory Sales",
        value: formatCurrency(totalReceiptRevenue),
        change: calculateChange(totalReceiptRevenue, 0),
        icon: ShoppingCart,
        description: "Revenue from inventory sales",
        color: "text-blue-600",
      },
      {
        title: "Inventory Value",
        value: formatCurrency(metrics.inventoryValue || 0),
        change: calculateChange(
          metrics.inventoryValue || 0,
          prevMetrics.inventoryValue || 0
        ),
        icon: Package,
        description: "Total value of inventory stock",
        color: "text-amber-600",
      },
      {
        title: "Active Projects",
        value: metrics.activeProjects?.toString() || "0",
        change: calculateChange(
          metrics.activeProjects || 0,
          prevMetrics.activeProjects || 0
        ),
        icon: Building2,
        description: "Projects currently in progress",
        color: "text-green-600",
      },
      {
        title: "Project Revenue",
        value: formatCurrency(metrics.projectRevenue || 0),
        change: calculateChange(
          metrics.projectRevenue || 0,
          prevMetrics.projectRevenue || 0
        ),
        icon: TrendingUp,
        description: "Revenue from project payments",
        color: "text-purple-600",
      },
      {
        title: "Completion Rate",
        value: `${successfulReceipts > 0 ? Math.round((successfulReceipts / (successfulReceipts + voidedReceipts)) * 100) : 0}%`,
        change: { value: 5, isPositive: true },
        icon: CheckCircle,
        description: "Successful transaction rate",
        color: "text-emerald-600",
      },
    ];
  }, [overviewData, comparisonData, receipts, calculateChange]);

  const prepareRevenueTrendData = useCallback((): RevenueTrendItem[] => {
    if (!overviewData?.revenueTrend) return [];
    return overviewData.revenueTrend.slice(-14).map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      Revenue: item.totalRevenue,
    }));
  }, [overviewData]);

  const prepareProjectStatusData = useCallback((): ProjectStatusItem[] => {
    if (!overviewData?.projectStatus) return [];
    return overviewData.projectStatus.map((item: any) => ({
      name: item.status,
      value: item.count,
    }));
  }, [overviewData]);

  const getRecentTransactions = useCallback((): TransactionItem[] => {
    return receipts.slice(0, 5).map((receipt, index) => ({
      id: index + 1,
      type: "inventory",
      amount: formatCurrencyDecimal(receipt.totalAmount),
      description: `Payment from ${receipt.clientInfo.clientName}`,
      date: format(new Date(receipt.transactionDate), "MMM dd, yyyy"),
      status: isVoided(receipt) ? "voided" : "completed",
    }));
  }, [receipts]);

  const renderOverviewContent = () => {
    if (!overviewData && !isRefreshing) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No overview data available</p>
            <Button onClick={refreshAllData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      );
    }

    const metrics = getMetrics();
    const revenueData = prepareRevenueTrendData();
    const projectStatusData = prepareProjectStatusData();
    const recentTransactions = getRecentTransactions();

    const totalProjects = projectStatusData.reduce(
      (sum: number, p: ProjectStatusItem) => sum + p.value,
      0
    );

    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-geist">
                Transaction Overview
              </h1>
              <p className="text-muted-foreground">
                Performance metrics and analytics for{" "}
                {format(memoizedStartDate, "MMM dd")} -{" "}
                {format(memoizedEndDate, "MMM dd, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={refreshAllData}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(), "EEEE, MMMM dd, yyyy")}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <Card
                key={index}
                className="border-border bg-card hover:shadow-md transition-shadow"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground font-geist">
                    {metric.title}
                  </CardTitle>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1 font-geist">
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
                        {metric.change.isPositive ? "increase" : "decrease"}{" "}
                        from last period
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
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground font-geist">
                  Revenue Trend
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  14-day revenue performance
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
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
                        className="w-full h-full [&_.recharts-wrapper]:w-full [&_.recharts-wrapper]:h-full"
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
              </CardContent>
            </Card>

            <Card className="border-border bg-card flex flex-col">
              <CardHeader>
                <CardTitle className="text-foreground font-geist">
                  Project Status
                </CardTitle>
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
                                    backgroundColor:
                                      DEFAULT_CHART_COLORS[index],
                                  }}
                                />
                                <span className="text-sm text-foreground font-geist">
                                  {item.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground font-geist">
                                  {item.value}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  (
                                  {totalProjects > 0
                                    ? Math.round(
                                        (item.value / totalProjects) * 100
                                      )
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
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-xl font-bold text-foreground font-geist">
                                {overviewData?.metrics?.totalProjects || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">
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
                                      r="40%"
                                      fill="transparent"
                                      stroke={DEFAULT_CHART_COLORS[index]}
                                      strokeWidth="16"
                                      strokeDasharray={`${percentage} ${
                                        100 - percentage
                                      }`}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground font-geist">
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
                      <TableHead className="text-foreground">
                        Description
                      </TableHead>
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
                          <TableCell className="font-medium text-foreground font-geist">
                            {tx.description}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${tx.type === "inventory" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}`}
                            >
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-foreground font-geist">
                            {tx.amount}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {tx.date}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tx.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                tx.status === "completed"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : "bg-red-100 text-red-800 hover:bg-red-100"
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

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground font-geist">
                  Performance Insights
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Key performance indicators and insights
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground font-geist">
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

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground font-geist">
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

                <div className="space-y-3">
                  <span className="text-sm font-medium text-foreground font-geist">
                    Revenue Distribution
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Inventory Sales
                      </span>
                      <span className="text-xs font-medium text-foreground font-geist">
                        {formatCurrency(
                          receipts
                            .filter((r) => !isVoided(r))
                            .reduce(
                              (sum, receipt) => sum + receipt.totalAmount,
                              0
                            )
                        )}
                      </span>
                    </div>
                    <Progress
                      value={
                        overviewData?.metrics?.totalRevenue
                          ? (receipts
                              .filter((r) => !isVoided(r))
                              .reduce(
                                (sum, receipt) => sum + receipt.totalAmount,
                                0
                              ) /
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
                      <span className="text-xs font-medium text-foreground font-geist">
                        {formatCurrency(
                          overviewData?.metrics?.projectRevenue || 0
                        )}
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

                <div className="pt-4 border-t border-border">
                  <span className="text-sm font-medium text-foreground mb-3 block font-geist">
                    Quick Actions
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleTabChange("Inventory PoS")}
                      variant="default"
                      size="sm"
                      className="text-xs"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      New Sale
                    </Button>
                    <Button
                      onClick={() => handleTabChange("Project Transactions")}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <Layers className="h-3 w-3 mr-1" />
                      View Projects
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectTransactionsContent = () => {
    return (
      <div className="h-full overflow-y-auto p-6">
        <ProjectTransactions />
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Inventory PoS":
        return (
          <InventoryPOS
            key={activeTab}
            onPaymentProcess={handleInventoryPOSPayment}
          />
        );
      case "Project Transactions":
        return renderProjectTransactionsContent();
      case "Receipt History":
        return (
          <div className="h-full overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 font-geist">
                Receipt History
              </h2>
              <Button
                onClick={() => {
                  loadReceipts();
                  toast.success("Receipts refreshed!");
                }}
                variant="outline"
                disabled={isLoadingReceipts}
                className="flex items-center gap-2"
              >
                {isLoadingReceipts ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <Receipt className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
            <ReceiptHistory
              receipts={receipts}
              onPrint={handlePrintReceipt}
              onVoid={handleVoidReceipt}
            />
            {isLoadingReceipts && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading receipts...</p>
              </div>
            )}
          </div>
        );
      case "Overview":
      default:
        return renderOverviewContent();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background font-geist">
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1 px-5 pt-5 pb-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-geist">
              Payment Transactions
            </h1>
            <p className="text-gray-600 mt-1 text-sm font-geist">
              Process client payments for downpayments, monthly loans, cash
              payments, and inventory items
            </p>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mt-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 font-geist whitespace-nowrap ${
                activeTab === tab
                  ? "border-foreground text-foreground"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">{renderTabContent()}</div>
    </div>
  );
}
