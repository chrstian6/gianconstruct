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
import { getUserTransactionsWithDetails } from "@/action/transaction";
import { format } from "date-fns";

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
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string | Date) => {
    try {
      return format(safeDate(date), "MMM dd, yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-orange-500 text-orange-500"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-gray-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get type badge color
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "downpayment":
        return <Badge className="bg-blue-500">Downpayment</Badge>;
      case "partial_payment":
        return <Badge className="bg-purple-500">Partial Payment</Badge>;
      case "full_payment":
        return <Badge className="bg-green-600">Full Payment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all your payment transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={loadTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
            <CardDescription className="text-2xl font-bold">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
            <CardDescription className="text-2xl font-bold">
              {formatCurrency(stats.totalAmount)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-500">
                {formatCurrency(stats.paidAmount)} paid
              </span>
              {" • "}
              <span className="text-orange-500">
                {formatCurrency(stats.pendingAmount)} pending
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Transactions
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-green-500">
              {stats.paid}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${Math.round((stats.paid / stats.total) * 100)}% of total`
                : "No transactions"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-orange-500">
              {stats.pending}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {stats.pendingAmount > 0
                ? `${formatCurrency(stats.pendingAmount)} due`
                : "No pending payments"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs View */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
              All ({transactions.length})
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              onClick={() => setStatusFilter("pending")}
            >
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="paid" onClick={() => setStatusFilter("paid")}>
              Paid ({stats.paid})
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search transactions..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="downpayment">Downpayment</SelectItem>
                  <SelectItem value="partial_payment">
                    Partial Payment
                  </SelectItem>
                  <SelectItem value="full_payment">Full Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <TransactionTable
            transactions={filteredTransactions}
            onViewDetails={viewTransactionDetails}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            getTypeBadge={getTypeBadge}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <TransactionTable
            transactions={filteredTransactions.filter(
              (t) => t.status === "pending"
            )}
            onViewDetails={viewTransactionDetails}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            getTypeBadge={getTypeBadge}
          />
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <TransactionTable
            transactions={filteredTransactions.filter(
              (t) => t.status === "paid"
            )}
            onViewDetails={viewTransactionDetails}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            getTypeBadge={getTypeBadge}
          />
        </TabsContent>
      </Tabs>

      {/* No Transactions State */}
      {filteredTransactions.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No transactions found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "No transactions match your filters. Try adjusting your search or filters."
                  : "You haven't made any transactions yet. Transactions will appear here once you make payments for your projects."}
              </p>
              {(searchQuery ||
                statusFilter !== "all" ||
                typeFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedTransaction && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transaction Details
                </DialogTitle>
                <DialogDescription>
                  Transaction ID: {selectedTransaction.transaction_id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
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

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Project Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Project ID
                      </p>
                      <p>{selectedTransaction.project_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Project Name
                      </p>
                      <p>
                        {selectedTransaction.project?.name || "Not available"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Created
                      </span>
                      <span className="text-sm">
                        {formatDate(selectedTransaction.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Due Date
                      </span>
                      <span className="text-sm">
                        {formatDate(selectedTransaction.due_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Payment Deadline
                      </span>
                      <span className="text-sm">
                        {formatDate(selectedTransaction.payment_deadline)}
                      </span>
                    </div>
                    {selectedTransaction.paid_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Paid At
                        </span>
                        <span className="text-sm">
                          {formatDate(selectedTransaction.paid_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedTransaction.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {selectedTransaction.notes}
                    </p>
                  </div>
                )}

                {selectedTransaction.payment_method && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Payment Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Method</p>
                        <p>{selectedTransaction.payment_method}</p>
                      </div>
                      {selectedTransaction.reference_number && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Reference
                          </p>
                          <p>{selectedTransaction.reference_number}</p>
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

// Transaction Table Component
function TransactionTable({
  transactions,
  onViewDetails,
  formatCurrency,
  formatDate,
  getStatusBadge,
  getTypeBadge,
}: {
  transactions: Transaction[];
  onViewDetails: (transaction: Transaction) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | Date) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  getTypeBadge: (type: string) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          Showing {transactions.length} transaction
          {transactions.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell className="font-medium">
                    {transaction.transaction_id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {transaction.project?.name || transaction.project_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.project_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>{formatDate(transaction.due_date)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(transaction)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
