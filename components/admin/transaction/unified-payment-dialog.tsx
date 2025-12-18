// components/admin/transaction/unified-payment-dialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { ProjectTransactionDetail } from "@/action/confirmed-projects";
import { useModalStore } from "@/lib/stores";
import { updateTransactionPayment } from "@/action/invoice";
import { createManualPayment } from "@/action/manual-payment";
import { format } from "date-fns";
import {
  CalendarIcon,
  CreditCard,
  X,
  FileText,
  DollarSign,
  Receipt,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface UnifiedPaymentDialogProps {
  onPaymentSuccess?: () => Promise<void>;
}

export const UnifiedPaymentDialog: React.FC<UnifiedPaymentDialogProps> = ({
  onPaymentSuccess,
}) => {
  const {
    isPaymentDialogOpen,
    paymentDialogState,
    setIsPaymentDialogOpen,
    isManualPaymentDialogOpen,
    manualPaymentData,
    setIsManualPaymentDialogOpen,
    resetManualPaymentData,
  } = useModalStore();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paidDate, setPaidDate] = useState<Date>(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentType, setPaymentType] = useState<
    "downpayment" | "partial_payment" | "balance" | "full"
  >("partial_payment");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const transaction = paymentDialogState.transaction;
  const isExistingTransaction = !!transaction;
  const isManualPayment = !!manualPaymentData;

  // Generate a proper reference number
  const generateReferenceNumber = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `REF-${timestamp}${random}`;
  };

  // Reset states when dialog opens
  useEffect(() => {
    if (isPaymentDialogOpen && transaction) {
      // Existing transaction payment
      setPaymentAmount(transaction.amount.toString());
      setPaidDate(new Date());
      setNotes("");
      setPaymentMethod("cash");
      setPaymentType(transaction.type as any);
      setReferenceNumber(generateReferenceNumber());
    } else if (isManualPaymentDialogOpen && manualPaymentData) {
      // New manual payment
      setPaidDate(new Date());
      setPaymentAmount(
        manualPaymentData.maxAmount
          ? Math.min(manualPaymentData.maxAmount, 10000).toString()
          : ""
      );
      setNotes(
        manualPaymentData.description ||
          `Payment for ${manualPaymentData.projectName}`
      );
      setPaymentMethod("cash");
      setPaymentType("partial_payment");
      setReferenceNumber(generateReferenceNumber());
    }
  }, [
    isPaymentDialogOpen,
    isManualPaymentDialogOpen,
    transaction,
    manualPaymentData,
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handlePaymentAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return;
    }

    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return;
    }

    setPaymentAmount(numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!paidDate) {
      toast.error("Please select a payment date");
      return;
    }

    setIsProcessing(true);

    try {
      const finalReferenceNumber =
        referenceNumber.trim() || generateReferenceNumber();
      let result;

      if (isExistingTransaction && transaction) {
        // Existing transaction payment - NO AMOUNT RESTRICTION
        result = await updateTransactionPayment({
          transactionId: transaction.transaction_id,
          amount: amountNum,
          paidDate: paidDate, // Pass Date object directly
          status: "paid",
          notes: notes.trim(),
          discount: 0,
          paymentMethod,
          referenceNumber: finalReferenceNumber,
        });
      } else if (isManualPayment && manualPaymentData) {
        // New manual payment - format date to YYYY-MM-DD string
        const formattedDate = format(paidDate, "yyyy-MM-dd");
        result = await createManualPayment({
          projectId: manualPaymentData.projectId,
          amount: amountNum,
          paymentDate: formattedDate,
          paymentMethod,
          referenceNumber: finalReferenceNumber,
          notes: notes.trim(),
          paymentType,
          description: manualPaymentData.description || "Manual Payment",
        });
      } else {
        toast.error("Invalid payment request");
        return;
      }

      if (result.success) {
        const successMessage = isExistingTransaction
          ? "Payment recorded successfully!"
          : "Manual payment recorded successfully!";

        toast.success(successMessage, {
          description: `Payment of ${formatCurrency(amountNum)} has been recorded. Reference: ${finalReferenceNumber}`,
          duration: 5000,
        });

        handleClose();

        // Call refresh callback after a short delay to ensure dialog is closed
        setTimeout(async () => {
          if (onPaymentSuccess) {
            try {
              await onPaymentSuccess();
            } catch (error) {
              console.error("Error refreshing transaction history:", error);
            }
          }
        }, 300);
      } else {
        toast.error(result.error || "Failed to record payment");
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Failed to record payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isExistingTransaction) {
      setIsPaymentDialogOpen(false);
    } else {
      setIsManualPaymentDialogOpen(false);
      resetManualPaymentData();
    }
    resetForm();
  };

  const resetForm = () => {
    setPaymentAmount("");
    setPaidDate(new Date());
    setNotes("");
    setPaymentMethod("cash");
    setReferenceNumber("");
    setPaymentType("partial_payment");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isProcessing) {
      handleClose();
    }
  };

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "check", label: "Check" },
    { value: "credit_card", label: "Credit Card" },
    { value: "debit_card", label: "Debit Card" },
    { value: "gcash", label: "GCash" },
    { value: "maya", label: "Maya" },
    { value: "other", label: "Other" },
  ];

  const paymentTypes = [
    { value: "downpayment", label: "Downpayment" },
    { value: "partial_payment", label: "Partial Payment" },
    { value: "balance", label: "Balance" },
    { value: "full", label: "Full Payment" },
  ];

  const isOpen = isPaymentDialogOpen || isManualPaymentDialogOpen;
  if (!isOpen) return null;

  const enteredAmount = parseFloat(paymentAmount) || 0;
  const transactionAmount = transaction?.amount || 0;
  const maxAmount = manualPaymentData?.maxAmount || 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {isExistingTransaction ? (
                  <CreditCard className="h-5 w-5" />
                ) : (
                  <PlusCircle className="h-5 w-5" />
                )}
                {isExistingTransaction ? "Record Payment" : "Manual Payment"}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1">
                {isExistingTransaction ? (
                  <>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                      {transaction.transaction_id}
                    </span>
                    <span>• {transaction.type.replace("_", " ")}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">
                      {manualPaymentData?.projectName || "Project"}
                    </span>
                    <span>• {manualPaymentData?.clientName || "Client"}</span>
                  </>
                )}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isProcessing}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Transaction/Project Information */}
            <div className="rounded-lg border p-4 bg-gray-50">
              <h3 className="font-semibold mb-3 text-gray-900">
                {isExistingTransaction
                  ? "Transaction Details"
                  : "Project Information"}
              </h3>

              {isExistingTransaction ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Transaction ID
                      </div>
                      <div className="text-sm font-mono font-semibold">
                        {transaction.transaction_id}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Type</div>
                      <Badge className="capitalize">
                        {transaction.type.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Original Amount
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(transactionAmount)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Due Date</div>
                      <div className="text-sm">
                        {new Date(transaction.due_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Current Status
                      </div>
                      <Badge
                        className={
                          transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {transaction.status.charAt(0).toUpperCase() +
                          transaction.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Project</div>
                    <div className="text-sm font-semibold">
                      {manualPaymentData?.projectName || "Project"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Client</div>
                    <div className="text-sm font-semibold">
                      {manualPaymentData?.clientName || "Client"}
                    </div>
                  </div>
                  {manualPaymentData?.totalValue && (
                    <>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Project Total
                        </div>
                        <div className="text-sm font-semibold">
                          {formatCurrency(manualPaymentData.totalValue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Remaining Balance
                        </div>
                        <div className="text-sm font-semibold text-orange-600">
                          {formatCurrency(maxAmount)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label
                htmlFor="paymentAmount"
                className="flex items-center gap-2 text-gray-900"
              >
                <DollarSign className="h-4 w-4" />
                Payment Amount *
                {maxAmount > 0 && !isExistingTransaction && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Max: {formatCurrency(maxAmount)})
                  </span>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₱
                </span>
                <Input
                  id="paymentAmount"
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => handlePaymentAmountChange(e.target.value)}
                  className="pl-8 text-lg font-medium"
                  placeholder="0.00"
                  required
                />
              </div>
              {isExistingTransaction && (
                <div className="text-sm text-gray-600">
                  Original amount: {formatCurrency(transactionAmount)}
                  {enteredAmount > transactionAmount && (
                    <span className="ml-2 text-orange-600">
                      (Overpayment allowed for downpayments)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label className="text-gray-900">Payment Date *</Label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-300",
                      !paidDate && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paidDate ? format(paidDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paidDate}
                    onSelect={(date) => {
                      if (date) {
                        setPaidDate(date);
                        setShowDatePicker(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment Type (only for manual payments) */}
            {!isExistingTransaction && (
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select
                  value={paymentType}
                  onValueChange={(value: any) => setPaymentType(value)}
                >
                  <SelectTrigger id="paymentType" className="border-gray-300">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="text-gray-900">
                Payment Method
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod" className="border-gray-300">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="referenceNumber" className="text-gray-900">
                Reference Number
              </Label>
              <div className="flex gap-2">
                <Input
                  id="referenceNumber"
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Will be auto-generated"
                  className="font-mono border-gray-300"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReferenceNumber(generateReferenceNumber())}
                  className="whitespace-nowrap border-gray-300"
                >
                  Regenerate
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Auto-generated reference number for tracking. You can edit it if
                needed.
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label
                htmlFor="notes"
                className="flex items-center gap-2 text-gray-900"
              >
                <FileText className="h-4 w-4" />
                Notes / Description
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this payment..."
                className="min-h-[100px] border-gray-300"
              />
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm border border-gray-200">
              <div className="font-medium text-gray-900 mb-2">
                Payment Summary
              </div>
              {isExistingTransaction ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(transactionAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Payment:</span>
                    <span className="font-bold">
                      {formatCurrency(enteredAmount)}
                    </span>
                  </div>
                  {enteredAmount > transactionAmount && (
                    <div className="flex justify-between text-green-600">
                      <span>Overpayment:</span>
                      <span className="font-medium">
                        {formatCurrency(enteredAmount - transactionAmount)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {manualPaymentData?.totalValue && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project Total:</span>
                        <span className="font-medium">
                          {formatCurrency(manualPaymentData.totalValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Already Paid:</span>
                        <span className="text-green-600">
                          {formatCurrency(manualPaymentData.totalPaid || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Remaining Balance:
                        </span>
                        <span className="text-orange-600 font-medium">
                          {formatCurrency(maxAmount)}
                        </span>
                      </div>
                    </>
                  )}
                  {enteredAmount > 0 && (
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <div className="flex justify-between font-medium">
                        <span>This Payment:</span>
                        <span>{formatCurrency(enteredAmount)}</span>
                      </div>
                      {enteredAmount > maxAmount && (
                        <div className="text-red-600 text-xs mt-1">
                          ⚠️ Amount exceeds remaining balance
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 pt-6 border-t">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="flex-1">
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900 mb-1">
                    Payment Details
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-bold">
                        {enteredAmount > 0
                          ? formatCurrency(enteredAmount)
                          : "₱0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>
                        {paidDate
                          ? format(paidDate, "MMM dd, yyyy")
                          : "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">
                        {(isExistingTransaction
                          ? transaction?.type
                          : paymentType
                        )?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="min-w-[100px] border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isProcessing ||
                    enteredAmount <= 0 ||
                    (!isExistingTransaction && enteredAmount > maxAmount)
                  }
                  className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    "Record Payment"
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
