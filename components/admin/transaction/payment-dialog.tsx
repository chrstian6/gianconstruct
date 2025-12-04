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
import { toast } from "sonner";
import { ProjectTransactionDetail } from "@/action/confirmed-projects";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  CreditCard,
  X,
  FileText,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useModalStore } from "@/lib/stores";
import { updateTransactionPayment } from "@/action/invoice";

export function PaymentDialog() {
  const { isPaymentDialogOpen, paymentDialogState, setIsPaymentDialogOpen } =
    useModalStore();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paidDate, setPaidDate] = useState<Date>(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const transaction = paymentDialogState.transaction;

  // Reset states when transaction changes
  useEffect(() => {
    if (transaction) {
      setPaymentAmount(transaction.amount.toString());
      setPaidDate(new Date());
      setNotes("");
      setPaymentMethod("manual");
      // Auto-generate a reference number
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      setReferenceNumber(`REF-${timestamp}${random}`);
    }
  }, [transaction]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `REF-${timestamp}${random}`;
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

  const handlePayment = async () => {
    if (!transaction) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (amount > transaction.amount) {
      toast.error("Payment amount cannot exceed the transaction amount");
      return;
    }

    setIsProcessing(true);

    try {
      // Use auto-generated reference number if not manually entered
      const finalReferenceNumber =
        referenceNumber.trim() || generateReferenceNumber();

      // Call server action to update transaction
      const result = await updateTransactionPayment({
        transactionId: transaction.transaction_id,
        amount,
        paidDate,
        status: "paid",
        notes: notes.trim(),
        discount: 0, // No discount feature
        paymentMethod,
        referenceNumber: finalReferenceNumber,
      });

      if (result.success) {
        toast.success("Payment recorded successfully!", {
          description: `Payment of ${formatCurrency(amount)} has been recorded. Reference: ${finalReferenceNumber}`,
          duration: 5000,
        });

        // Close the dialog
        setIsPaymentDialogOpen(false);

        // Show success details
        if (result.data) {
          toast.info("Transaction Details:", {
            description: `Status: ${result.data.status}\nMethod: ${paymentMethod}\nReference: ${finalReferenceNumber}`,
            duration: 4000,
          });
        }
      } else {
        toast.error(result.error || "Failed to record payment", {
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Failed to record payment", {
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isProcessing) {
      setIsPaymentDialogOpen(false);
    }
  };

  const paymentMethods = [
    { value: "manual", label: "Manual Entry" },
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "gcash", label: "GCash" },
    { value: "paymaya", label: "PayMaya" },
    { value: "credit_card", label: "Credit Card" },
    { value: "check", label: "Check" },
  ];

  if (!transaction) return null;

  const transactionAmount = transaction.amount;
  const enteredAmount = parseFloat(paymentAmount) || 0;

  return (
    <Dialog open={isPaymentDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Record Payment
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                  {transaction.transaction_id}
                </span>
                <span>• {transaction.type.replace("_", " ")}</span>
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={isProcessing}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Details */}
          <div className="rounded-lg border p-4 bg-gray-50">
            <h3 className="font-semibold mb-3 text-gray-900">
              Transaction Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
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

            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-1">Original Amount</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(transactionAmount)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Due Date</div>
                <div className="text-sm">
                  {new Date(transaction.due_date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Current Status</div>
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

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label
              htmlFor="paymentAmount"
              className="flex items-center gap-2 text-gray-900"
            >
              <DollarSign className="h-4 w-4" />
              Payment Amount *
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
              />
            </div>
            <div className="text-sm text-gray-600">
              Original amount: {formatCurrency(transactionAmount)}
            </div>
          </div>

          {/* Payment Date - Using proper calendar picker */}
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

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="text-gray-900">
              Payment Method
            </Label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Number (Read-only, auto-generated) */}
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
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReferenceNumber(generateReferenceNumber())}
                className="whitespace-nowrap"
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
              Payment Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payment..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="mt-6 pt-6 border-t">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex-1">
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-900 mb-1">
                  Payment Summary
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-bold">
                      {formatCurrency(enteredAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{format(paidDate, "MMM dd, yyyy")}</span>
                  </div>
                  {enteredAmount < transactionAmount && (
                    <div className="flex justify-between text-orange-600">
                      <span>Remaining:</span>
                      <span className="font-medium">
                        {formatCurrency(transactionAmount - enteredAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                disabled={isProcessing}
                className="min-w-[100px] border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isProcessing || enteredAmount <= 0}
                className="bg-green-600 hover:bg-green-700 min-w-[120px]"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Record Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
