// components/user/UserTransactions.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  Download,
  Eye,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserTransactionsWithDetails } from "@/action/transaction";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectDetails {
  name: string;
  status: string;
  totalCost: number;
}

interface Transaction {
  _id: string;
  transaction_id: string;
  project_id: string;
  user_id: string;
  amount: number;
  total_amount: number;
  type: string;
  status: "pending" | "paid" | "cancelled";
  due_date: string | Date;
  payment_deadline: string | Date;
  paid_at?: string | Date;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_at: string | Date;
  updated_at: string | Date;
  project?: ProjectDetails | null;
}

// Helper function to safely convert date
const safeDate = (date: string | Date | undefined): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  return new Date(date);
};

// Helper function to process transaction data from server
const processTransactionData = (data: any): Transaction => {
  return {
    _id: data._id?.toString() || data._id || "",
    transaction_id: data.transaction_id || "",
    project_id: data.project_id || "",
    user_id: data.user_id || "",
    amount: Number(data.amount) || 0,
    total_amount: Number(data.total_amount) || 0,
    type: data.type || "unknown",
    status: data.status || "pending",
    due_date: data.due_date || new Date(),
    payment_deadline: data.payment_deadline || new Date(),
    paid_at: data.paid_at,
    payment_method: data.payment_method,
    reference_number: data.reference_number,
    notes: data.notes,
    created_at: data.created_at || new Date(),
    updated_at: data.updated_at || new Date(),
    project: data.project || null,
  };
};

// Mobile Transaction Card Component
function MobileTransactionCard({
  transaction,
  onViewDetails,
  formatCurrency,
  formatDate,
  getStatusBadge,
  getTypeBadge,
}: {
  transaction: Transaction;
  onViewDetails: (transaction: Transaction) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | Date) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  getTypeBadge: (type: string) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="mb-3 overflow-hidden">
      <CardContent className="p-4">
        {/* Main Content - Always Visible */}
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  {transaction.transaction_id}
                </span>
                <div className="hidden sm:block">
                  {getTypeBadge(transaction.type)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {transaction.project?.name || transaction.project_id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="sm:hidden">{getTypeBadge(transaction.type)}</div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onViewDetails(transaction)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="h-8 w-8 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Status and Amount Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusBadge(transaction.status)}
            </div>
            <div className="font-semibold text-sm sm:text-base">
              {formatCurrency(transaction.amount)}
            </div>
          </div>

          {/* Due Date - Always visible on mobile */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Due: {formatDate(transaction.due_date)}</span>
            {transaction.paid_at && (
              <span className="text-green-600">
                Paid: {formatDate(transaction.paid_at)}
              </span>
            )}
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="pt-3 border-t space-y-3 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(transaction.total_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Payment Method
                  </p>
                  <p className="text-sm capitalize">
                    {transaction.payment_method || "Not specified"}
                  </p>
                </div>
              </div>
              {transaction.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm line-clamp-2">{transaction.notes}</p>
                </div>
              )}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onViewDetails(transaction)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Details
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Load transactions
  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const result = await getUserTransactionsWithDetails();
      if (result.success && result.transactions) {
        // Process transactions to convert MongoDB objects to plain objects
        const processedTransactions = result.transactions.map(
          processTransactionData
        );
        setTransactions(processedTransactions);
        setFilteredTransactions(processedTransactions);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (transaction) =>
          transaction.transaction_id.toLowerCase().includes(query) ||
          transaction.project_id.toLowerCase().includes(query) ||
          transaction.project?.name?.toLowerCase().includes(query) ||
          transaction.notes?.toLowerCase().includes(query) ||
          transaction.type.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.status === statusFilter
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.type === typeFilter
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, statusFilter, typeFilter]);

  // Calculate statistics
  const stats = {
    total: transactions.length,
    paid: transactions.filter((t) => t.status === "paid").length,
    pending: transactions.filter((t) => t.status === "pending").length,
    cancelled: transactions.filter((t) => t.status === "cancelled").length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    paidAmount: transactions
      .filter((t) => t.status === "paid")
      .reduce((sum, t) => sum + t.amount, 0),
    pendingAmount: transactions
      .filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + t.amount, 0),
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date for mobile display
  const formatDateMobile = (date: string | Date) => {
    try {
      const d = safeDate(date);
      const now = new Date();
      const diffDays = Math.floor(
        (d.getTime() - now.getTime()) / (1000 * 3600 * 24)
      );

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Tomorrow";
      if (diffDays === -1) return "Yesterday";
      if (diffDays < 7 && diffDays > -7) {
        return format(d, "EEE, MMM d");
      }
      return format(d, "MMM d");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format date for desktop
  const formatDate = (date: string | Date) => {
    try {
      return format(safeDate(date), "MMM dd, yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get status badge color - TEXT ONLY for mobile, icons for desktop
  const getStatusBadge = (status: string) => {
    const baseClasses =
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";

    switch (status) {
      case "paid":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle className="h-3 w-3 mr-1 hidden sm:inline" />
            <span>Paid</span>
          </span>
        );
      case "pending":
        return (
          <span
            className={`${baseClasses} bg-orange-100 text-orange-800 border border-orange-200`}
          >
            <Clock className="h-3 w-3 mr-1 hidden sm:inline" />
            <span>Pending</span>
          </span>
        );
      case "cancelled":
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <AlertCircle className="h-3 w-3 mr-1 hidden sm:inline" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
    }
  };

  // Get type badge color - TEXT ONLY for mobile, full text for desktop
  const getTypeBadge = (type: string) => {
    const baseClasses =
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";

    switch (type) {
      case "downpayment":
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <span className="sm:hidden">DP</span>
            <span className="hidden sm:inline">Downpayment</span>
          </span>
        );
      case "partial_payment":
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
            <span className="sm:hidden">Partial</span>
            <span className="hidden sm:inline">Partial Payment</span>
          </span>
        );
      case "full_payment":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <span className="sm:hidden">Full</span>
            <span className="hidden sm:inline">Full Payment</span>
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <span className="truncate max-w-[60px] sm:max-w-none">{type}</span>
          </span>
        );
    }
  };

  // View transaction details
  const viewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsViewDialogOpen(true);
  };

  // Export transactions as CSV
  const exportToCSV = () => {
    const headers = [
      "Transaction ID",
      "Project ID",
      "Project Name",
      "Amount",
      "Total Amount",
      "Type",
      "Status",
      "Due Date",
      "Payment Deadline",
      "Paid At",
      "Payment Method",
      "Reference Number",
      "Notes",
      "Created At",
    ];

    const csvData = filteredTransactions.map((transaction) => [
      transaction.transaction_id,
      transaction.project_id,
      transaction.project?.name || "N/A",
      transaction.amount,
      transaction.total_amount,
      transaction.type,
      transaction.status,
      formatDate(transaction.due_date),
      formatDate(transaction.payment_deadline),
      transaction.paid_at ? formatDate(transaction.paid_at) : "N/A",
      transaction.payment_method || "N/A",
      transaction.reference_number || "N/A",
      transaction.notes || "N/A",
      formatDate(transaction.created_at),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "all") {
      setStatusFilter("all");
    } else if (value === "pending") {
      setStatusFilter("pending");
    } else if (value === "paid") {
      setStatusFilter("paid");
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 md:h-10 w-32 md:w-48" />
            <Skeleton className="h-4 w-48 md:w-64 mt-2" />
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <Skeleton className="h-9 w-28 md:w-32" />
            <Skeleton className="h-9 w-28 md:w-32" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="col-span-1">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-16 md:w-24" />
                <Skeleton className="h-6 md:h-8 w-20 md:w-32 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 md:w-48" />
            <Skeleton className="h-4 w-40 md:w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            My Transactions
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            View and manage all your payment transactions
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button
            size="sm"
            onClick={loadTransactions}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
            <CardDescription className="text-xl md:text-2xl font-bold">
              {stats.total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-500">{stats.paid} paid</span>
              {" • "}
              <span className="text-orange-500">{stats.pending} pending</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
            <CardDescription className="text-xl md:text-2xl font-bold truncate">
              {formatCurrency(stats.totalAmount)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground truncate">
              <span className="text-green-500">
                {formatCurrency(stats.paidAmount)} paid
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
            <CardDescription className="text-xl md:text-2xl font-bold text-green-500">
              {stats.paid}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${Math.round((stats.paid / stats.total) * 100)}%`
                : "0%"}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <CardDescription className="text-xl md:text-2xl font-bold text-orange-500">
              {stats.pending}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground truncate">
              {formatCurrency(stats.pendingAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters - Responsive */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <TabsList className="w-full md:w-auto grid grid-cols-3">
            <TabsTrigger value="all" className="text-xs md:text-sm">
              All
              <span className="hidden md:inline"> ({transactions.length})</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">
              Pending
              <span className="hidden md:inline"> ({stats.pending})</span>
            </TabsTrigger>
            <TabsTrigger value="paid" className="text-xs md:text-sm">
              Paid<span className="hidden md:inline"> ({stats.paid})</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Search - Full width on mobile, fixed on desktop */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search transactions..."
                className="pl-9 w-full md:w-[200px] lg:w-[250px] text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                  aria-label="Clear search"
                >
                  <span className="sr-only">Clear search</span>
                  <span className="text-xs">✕</span>
                </button>
              )}
            </div>

            {/* Filters - Dropdown on mobile, side-by-side on desktop */}
            <div className="flex gap-2">
              {/* Type Filter - Full width on mobile */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[140px] lg:w-[180px] text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">
                    All Types
                  </SelectItem>
                  <SelectItem value="downpayment" className="text-sm">
                    Downpayment
                  </SelectItem>
                  <SelectItem value="partial_payment" className="text-sm">
                    Partial Payment
                  </SelectItem>
                  <SelectItem value="full_payment" className="text-sm">
                    Full Payment
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Filter Dropdown for additional options */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="p-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Quick Actions
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={exportToCSV}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start mt-1"
                        onClick={loadTransactions}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Content - Different view for mobile/desktop */}
        <div className="lg:hidden">
          {/* Mobile View - Cards */}
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <MobileTransactionCard
                  key={transaction._id}
                  transaction={transaction}
                  onViewDetails={viewTransactionDetails}
                  formatCurrency={formatCurrency}
                  formatDate={formatDateMobile}
                  getStatusBadge={getStatusBadge}
                  getTypeBadge={getTypeBadge}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Wallet className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-base md:text-lg font-semibold mb-2">
                      No transactions found
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchQuery ||
                      statusFilter !== "all" ||
                      typeFilter !== "all"
                        ? "No transactions match your filters."
                        : "You haven't made any transactions yet."}
                    </p>
                    {(searchQuery ||
                      statusFilter !== "all" ||
                      typeFilter !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setTypeFilter("all");
                          setActiveTab("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          {/* Desktop View - Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    Showing {filteredTransactions.length} transaction
                    {filteredTransactions.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {searchQuery && `Search: "${searchQuery}"`}
                  {typeFilter !== "all" && ` • Type: ${typeFilter}`}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">
                          Transaction ID
                        </TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead className="w-[120px]">Amount</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[150px]">Due Date</TableHead>
                        <TableHead className="w-[80px] text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell className="font-medium font-mono text-xs">
                            {transaction.transaction_id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium truncate max-w-[200px]">
                                {transaction.project?.name ||
                                  transaction.project_id}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {transaction.project_id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            {getTypeBadge(transaction.type)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                          <TableCell>
                            {formatDate(transaction.due_date)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                viewTransactionDetails(transaction)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>

      {/* Transaction Details Dialog - Responsive */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTransaction && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transaction Details
                </DialogTitle>
                <DialogDescription className="font-mono text-sm break-all">
                  ID: {selectedTransaction.transaction_id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status and Type Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(selectedTransaction.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Type
                    </p>
                    <div className="mt-1">
                      {getTypeBadge(selectedTransaction.type)}
                    </div>
                  </div>
                </div>

                {/* Amount Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Amount
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Project Cost
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(selectedTransaction.total_amount)}
                    </p>
                  </div>
                </div>

                {/* Project Information */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Project Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Project ID
                      </p>
                      <p className="font-mono text-sm break-all">
                        {selectedTransaction.project_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Project Name
                      </p>
                      <p className="font-medium">
                        {selectedTransaction.project?.name || "Not available"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline - Responsive */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-sm text-muted-foreground">
                        Created
                      </span>
                      <span className="text-sm font-medium">
                        {formatDate(selectedTransaction.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-sm text-muted-foreground">
                        Due Date
                      </span>
                      <span className="text-sm font-medium">
                        {formatDate(selectedTransaction.due_date)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-sm text-muted-foreground">
                        Payment Deadline
                      </span>
                      <span className="text-sm font-medium">
                        {formatDate(selectedTransaction.payment_deadline)}
                      </span>
                    </div>
                    {selectedTransaction.paid_at && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-sm text-muted-foreground">
                          Paid At
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {formatDate(selectedTransaction.paid_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedTransaction.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                      {selectedTransaction.notes}
                    </p>
                  </div>
                )}

                {/* Payment Information */}
                {selectedTransaction.payment_method && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Payment Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Method</p>
                        <p className="font-medium capitalize">
                          {selectedTransaction.payment_method}
                        </p>
                      </div>
                      {selectedTransaction.reference_number && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Reference
                          </p>
                          <p className="font-mono text-sm break-all">
                            {selectedTransaction.reference_number}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
