// components/admin/transaction/transaction-history.tsx
"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  FileText,
  DollarSign,
  Send,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  Banknote,
  PlusCircle,
  Bell,
  Mail,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectTransactionDetail } from "@/action/confirmed-projects";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendInvoiceEmail } from "@/action/invoice";
import { useModalStore } from "@/lib/stores";
import { UnifiedPaymentDialog } from "@/components/admin/transaction/unified-payment-dialog";
import { TransactionHistorySkeleton } from "@/components/admin/transaction/skeleton/transaction-history-skeleton";

interface TransactionHistoryProps {
  transactions: ProjectTransactionDetail[];
  isLoading?: boolean;
  projectId?: string;
  clientEmail?: string;
  clientName?: string;
  projectName?: string;
  totalValue?: number;
  onRefresh?: () => Promise<void>;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isLoading = false,
  projectId,
  clientEmail,
  clientName,
  projectName,
  totalValue = 0,
  onRefresh,
}) => {
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [isSendingIndividualInvoice, setIsSendingIndividualInvoice] = useState<
    string | null
  >(null);
  const { setIsPaymentDialogOpen, setIsManualPaymentDialogOpen } =
    useModalStore();

  // Calculate payment summary
  const calculatePaymentSummary = () => {
    const paidTransactions = transactions.filter((t) => t.status === "paid");
    const pendingTransactions = transactions.filter(
      (t) => t.status === "pending"
    );

    const totalPaid = paidTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalPending = pendingTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const remainingBalance = Math.max(0, totalValue - totalPaid);

    return {
      totalPaid,
      totalPending,
      remainingBalance,
      paidCount: paidTransactions.length,
      pendingCount: pendingTransactions.length,
    };
  };

  const paymentSummary = calculatePaymentSummary();
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatDateFull = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatCurrencyWithDecimal = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">
            Pending
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
            Expired
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            {status}
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "downpayment":
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            Downpayment
          </Badge>
        );
      case "partial_payment":
        return (
          <Badge
            variant="outline"
            className="border-purple-300 text-purple-700"
          >
            Partial
          </Badge>
        );
      case "balance":
        return (
          <Badge
            variant="outline"
            className="border-orange-300 text-orange-700"
          >
            Balance
          </Badge>
        );
      case "full":
        return (
          <Badge variant="outline" className="border-green-300 text-green-700">
            Full
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-700">
            {type}
          </Badge>
        );
    }
  };

  const handleSendInvoice = async (transaction: ProjectTransactionDetail) => {
    if (!clientEmail) {
      toast.error("Client email is required to send invoice");
      return;
    }

    if (!projectId) {
      toast.error("Project ID is required");
      return;
    }

    setIsSendingIndividualInvoice(transaction.transaction_id);

    try {
      const result = await sendInvoiceEmail({
        transactionId: transaction.transaction_id,
        clientEmail,
        clientName: clientName || "Valued Client",
        projectId,
        projectName: projectName || "Project",
        amount: transaction.amount,
        dueDate: transaction.due_date,
        type: transaction.type,
        description: `Payment for ${transaction.type.replace("_", " ")} - ${projectName || "Project"}`,
      });

      if (result.success) {
        toast.success("Invoice sent successfully! Client has been notified.");
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        toast.error(result.error || "Failed to send invoice");
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error("Failed to send invoice");
    } finally {
      setIsSendingIndividualInvoice(null);
    }
  };

  // Handle Pay Now for existing pending transactions
  const handlePayNow = (transaction: ProjectTransactionDetail) => {
    setIsPaymentDialogOpen(true, transaction);
  };

  const handleMakeAdditionalPayment = () => {
    if (!clientEmail || !projectId) {
      toast.error("Missing required information to create payment");
      return;
    }

    setIsManualPaymentDialogOpen(true, {
      projectId,
      clientEmail,
      clientName: clientName || "Client",
      projectName: projectName || "Project",
      remainingBalance: paymentSummary.remainingBalance,
      totalValue,
      totalPaid: paymentSummary.totalPaid,
      description: `Manual payment for ${projectName || "Project"}`,
      maxAmount: paymentSummary.remainingBalance,
    });
  };

  // Send invoice for the entire project (summary invoice)
  const handleSendProjectInvoice = async () => {
    if (!clientEmail) {
      toast.error("Client email is required to send invoice");
      return;
    }

    if (!projectId) {
      toast.error("Project ID is required");
      return;
    }

    if (transactions.length === 0) {
      toast.info("No transactions found to send invoice");
      return;
    }

    setIsSendingInvoice(true);

    try {
      const totalPending = paymentSummary.totalPending;
      const totalPaid = paymentSummary.totalPaid;
      const remainingBalance = paymentSummary.remainingBalance;

      const currentDate = new Date().toISOString();

      if (remainingBalance > 0) {
        const description =
          `Project Invoice - ${projectName || "Project"}\n\n` +
          `Project Total: ${formatCurrencyWithDecimal(totalValue)}\n` +
          `Total Paid to Date: ${formatCurrencyWithDecimal(totalPaid)}\n` +
          `Remaining Balance Due: ${formatCurrencyWithDecimal(remainingBalance)}\n` +
          `Invoice Date: ${formatDateFull(currentDate)}\n\n` +
          `Payment Summary:\n` +
          `● Total Project Value: ${formatCurrencyWithDecimal(totalValue)}\n` +
          `● Amount Paid: ${formatCurrencyWithDecimal(totalPaid)}\n` +
          `● Balance Due: ${formatCurrencyWithDecimal(remainingBalance)}\n` +
          `● Payment Progress: ${Math.round((totalPaid / totalValue) * 100)}%\n\n` +
          `Please pay the remaining balance of ${formatCurrencyWithDecimal(remainingBalance)} to complete your project payments.`;

        const result = await sendInvoiceEmail({
          transactionId: `invoice-${Date.now()}`,
          clientEmail,
          clientName: clientName || "Valued Client",
          projectId,
          projectName: projectName || "Project",
          amount: remainingBalance,
          dueDate: currentDate,
          type: "balance_due",
          description: description,
        });

        if (result.success) {
          toast.success(
            `Invoice for ${formatCurrencyWithDecimal(remainingBalance)} sent successfully!`
          );
          if (onRefresh) {
            await onRefresh();
          }
        } else {
          toast.error(result.error || "Failed to send project invoice");
        }
      } else {
        const description =
          `Payment Receipt - ${projectName || "Project"}\n\n` +
          `Project Total: ${formatCurrencyWithDecimal(totalValue)}\n` +
          `Total Amount Paid: ${formatCurrencyWithDecimal(totalPaid)}\n` +
          `Payment Status: FULLY PAID\n` +
          `Payment Date: ${formatDateFull(currentDate)}\n\n` +
          `Payment Summary:\n` +
          `● Total Project Value: ${formatCurrencyWithDecimal(totalValue)}\n` +
          `● Total Amount Paid: ${formatCurrencyWithDecimal(totalPaid)}\n` +
          `● Remaining Balance: ${formatCurrencyWithDecimal(0)}\n` +
          `● Payment Status: COMPLETED\n\n` +
          `Thank you for your business! All payments have been received and your project is fully paid.`;

        const result = await sendInvoiceEmail({
          transactionId: `receipt-${Date.now()}`,
          clientEmail,
          clientName: clientName || "Valued Client",
          projectId,
          projectName: projectName || "Project",
          amount: 0,
          dueDate: currentDate,
          type: "receipt",
          description: description,
        });

        if (result.success) {
          toast.success("Payment receipt sent successfully!");
        } else {
          toast.error(result.error || "Failed to send payment receipt");
        }
      }
    } catch (error) {
      console.error("Error sending project invoice:", error);
      toast.error("Failed to send project invoice");
    } finally {
      setIsSendingInvoice(false);
    }
  };

  // Handle sending all invoices (for pending transactions)
  const handleSendAllInvoices = async () => {
    if (!clientEmail) {
      toast.error("Client email is required to send invoices");
      return;
    }

    if (!projectId) {
      toast.error("Project ID is required");
      return;
    }

    const pendingTransactions = transactions.filter(
      (t) => t.status === "pending"
    );

    if (pendingTransactions.length === 0) {
      toast.info("No pending transactions to send invoices for");
      return;
    }

    setIsSendingInvoice(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const transaction of pendingTransactions) {
        try {
          const result = await sendInvoiceEmail({
            transactionId: transaction.transaction_id,
            clientEmail,
            clientName: clientName || "Valued Client",
            projectId,
            projectName: projectName || "Project",
            amount: transaction.amount,
            dueDate: transaction.due_date,
            type: transaction.type,
            description: `Payment for ${transaction.type.replace("_", " ")} - ${projectName || "Project"}. Due Date: ${formatDateFull(transaction.due_date)}`,
          });

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Sent ${successCount} invoice${successCount !== 1 ? "s" : ""} successfully!`
        );
        if (onRefresh) {
          await onRefresh();
        }
      }

      if (errorCount > 0) {
        toast.error(
          `Failed to send ${errorCount} invoice${errorCount !== 1 ? "s" : ""}`
        );
      }
    } catch (error) {
      console.error("Error sending invoices:", error);
      toast.error("Failed to send invoices");
    } finally {
      setIsSendingInvoice(false);
    }
  };

  // Refresh transaction history
  const handleRefreshTransactions = async () => {
    if (onRefresh) {
      try {
        await onRefresh();
        toast.success("Transaction history refreshed");
      } catch (error) {
        console.error("Error refreshing transactions:", error);
        toast.error("Failed to refresh transactions");
      }
    }
  };

  // Check if there are any pending transactions
  const hasPendingTransactions = transactions.some(
    (t) => t.status === "pending"
  );

  // Show skeleton loading
  if (isLoading) {
    return <TransactionHistorySkeleton />;
  }

  return (
    <Card className="border-gray-300">
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Receipt className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription className="text-gray-600">
                {transactions.length} transaction
                {transactions.length !== 1 ? "s" : ""} found •
                {hasPendingTransactions
                  ? " Some payments are pending"
                  : " All payments are settled"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {clientEmail && (
                <>
                  {/* Send Invoice button */}
                  {transactions.length > 0 && (
                    <Button
                      onClick={handleSendProjectInvoice}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 border-blue-500 text-blue-700 hover:bg-blue-50"
                      disabled={isSendingInvoice}
                    >
                      <Mail className="h-4 w-4" />
                      {isSendingInvoice ? "Sending..." : "Send Invoice"}
                    </Button>
                  )}

                  {/* Additional Payment button */}
                  {paymentSummary.remainingBalance > 0 && (
                    <Button
                      onClick={handleMakeAdditionalPayment}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Payment
                    </Button>
                  )}

                  {/* Send All Invoices button */}
                  {hasPendingTransactions && (
                    <Button
                      onClick={handleSendAllInvoices}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={isSendingInvoice}
                    >
                      <Bell className="h-4 w-4" />
                      {isSendingInvoice ? "Sending..." : "Remind All"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Payment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700">
                    Total Project Value
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrencyWithDecimal(totalValue)}
                  </p>
                </div>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">
                    Total Paid
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrencyWithDecimal(paymentSummary.totalPaid)}
                  </p>
                  <p className="text-xs text-green-600">
                    {paymentSummary.paidCount} transaction
                    {paymentSummary.paidCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-700">
                    Pending Payment
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrencyWithDecimal(paymentSummary.totalPending)}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {paymentSummary.pendingCount} transaction
                    {paymentSummary.pendingCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-700">
                    Balance Due
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrencyWithDecimal(paymentSummary.remainingBalance)}
                  </p>
                  <p className="text-xs text-orange-600">
                    {paymentSummary.remainingBalance > 0
                      ? "Payment required"
                      : "Fully paid"}
                  </p>
                </div>
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {totalValue > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Payment Progress</span>
                <span className="font-medium text-gray-900">
                  {Math.round((paymentSummary.totalPaid / totalValue) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (paymentSummary.totalPaid / totalValue) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>₱0</span>
                <span>{formatCurrencyWithDecimal(totalValue)}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Transactions Found
            </h3>
            <p className="text-gray-600">
              No transactions have been recorded for this project yet.
            </p>
            {clientEmail && paymentSummary.remainingBalance > 0 && (
              <Button
                onClick={handleMakeAdditionalPayment}
                className="mt-4 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Create First Payment
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-gray-300 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-700 bg-gray-50">
                    Transaction ID
                  </TableHead>
                  <TableHead className="text-gray-700 bg-gray-50">
                    Type
                  </TableHead>
                  <TableHead className="text-gray-700 bg-gray-50">
                    Amount
                  </TableHead>
                  <TableHead className="text-gray-700 bg-gray-50">
                    Status
                  </TableHead>
                  <TableHead className="text-gray-700 bg-gray-50">
                    Due Date
                  </TableHead>
                  <TableHead className="text-gray-700 bg-gray-50">
                    Paid Date
                  </TableHead>
                  <TableHead className="text-gray-700 bg-gray-50">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.transaction_id}
                    className="border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-mono text-sm text-gray-700">
                      {transaction.transaction_id}
                    </TableCell>
                    <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {formatCurrencyWithDecimal(transaction.amount)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell className="text-gray-700">
                      {formatDate(transaction.due_date)}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {transaction.paid_at ? (
                        formatDate(transaction.paid_at)
                      ) : (
                        <span className="text-gray-500">Not paid yet</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {transaction.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handlePayNow(transaction)}
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              Pay Now
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => handleSendInvoice(transaction)}
                              disabled={
                                isSendingIndividualInvoice ===
                                transaction.transaction_id
                              }
                            >
                              {isSendingIndividualInvoice ===
                              transaction.transaction_id ? (
                                <>
                                  <div className="animate-spin h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="h-3.5 w-3.5" />
                                  Send Invoice
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        {transaction.status === "paid" && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(transaction.paid_at!)}
                            </span>
                          </div>
                        )}
                        {transaction.status === "expired" && (
                          <Badge
                            variant="outline"
                            className="border-red-300 text-red-700"
                          >
                            Expired
                          </Badge>
                        )}
                        {transaction.status === "cancelled" && (
                          <Badge
                            variant="outline"
                            className="border-gray-300 text-gray-700"
                          >
                            Cancelled
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Unified Payment Dialog - Pass the refresh callback */}
      <UnifiedPaymentDialog onPaymentSuccess={handleRefreshTransactions} />
    </Card>
  );
};
