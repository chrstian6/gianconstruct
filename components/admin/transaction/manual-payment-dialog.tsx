// components/admin/transaction/manual-payment-dialog.tsx
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
import { useModalStore } from "@/lib/stores";
import { createManualPayment } from "@/action/manual-payment";
import { format } from "date-fns";
import { CalendarIcon, X, DollarSign, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualPaymentDialogProps {
  onPaymentSuccess?: () => Promise<void>;
}

export const ManualPaymentDialog: React.FC<ManualPaymentDialogProps> = ({
  onPaymentSuccess,
}) => {
  const {
    isManualPaymentDialogOpen,
    manualPaymentData,
    setIsManualPaymentDialogOpen,
    resetManualPaymentData,
  } = useModalStore();

  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentType, setPaymentType] = useState<
    "downpayment" | "partial_payment" | "balance" | "full"
  >("partial_payment");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isManualPaymentDialogOpen && manualPaymentData) {
      setPaymentDate(new Date());
      setAmount(
        manualPaymentData.maxAmount
          ? Math.min(manualPaymentData.maxAmount, 10000).toString()
          : ""
      );
      setNotes(
        manualPaymentData.description ||
          `Payment for ${manualPaymentData.projectName}`
      );
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      setReferenceNumber(`REF-${timestamp}${random}`);
    }
  }, [isManualPaymentDialogOpen, manualPaymentData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualPaymentData?.projectId) {
      toast.error("Project information is missing");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (
      manualPaymentData.maxAmount &&
      amountNum > manualPaymentData.maxAmount
    ) {
      toast.error(
        `Amount cannot exceed remaining balance of ₱${manualPaymentData.maxAmount.toLocaleString()}`
      );
      return;
    }

    if (!paymentDate) {
      toast.error("Please select a payment date");
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedDate = format(paymentDate, "yyyy-MM-dd");

      const result = await createManualPayment({
        projectId: manualPaymentData.projectId,
        amount: amountNum,
        paymentDate: formattedDate,
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim(),
        paymentType,
        description: manualPaymentData.description || "Manual Payment",
      });

      if (result.success) {
        toast.success("Manual payment recorded successfully!");
        if (onPaymentSuccess) {
          await onPaymentSuccess();
        }
        handleClose();
      } else {
        toast.error(result.error || "Failed to record manual payment");
      }
    } catch (error) {
      console.error("Error creating manual payment:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsManualPaymentDialogOpen(false);
    resetManualPaymentData();
    setAmount("");
    setPaymentDate(new Date());
    setPaymentMethod("cash");
    setReferenceNumber("");
    setNotes("");
    setPaymentType("partial_payment");
  };

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `REF-${timestamp}${random}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (!manualPaymentData) return null;

  const enteredAmount = parseFloat(amount) || 0;
  const maxAmount = manualPaymentData.maxAmount || 0;

  return (
    <Dialog open={isManualPaymentDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Record Manual Payment</DialogTitle>
              <DialogDescription>
                Record a manual payment for{" "}
                {manualPaymentData.projectName || "this project"}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Project Information */}
            <div className="rounded-lg border p-4 bg-gray-50">
              <h3 className="font-semibold mb-3 text-gray-900">
                Project Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Project</div>
                  <div className="text-sm font-semibold">
                    {manualPaymentData.projectName || "Project"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Client</div>
                  <div className="text-sm font-semibold">
                    {manualPaymentData.clientName || "Client"}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="flex items-center gap-2 text-gray-900"
              >
                <DollarSign className="h-4 w-4" />
                Amount *
                {maxAmount > 0 && (
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
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9.]/g, "");
                    const parts = numericValue.split(".");
                    if (parts.length <= 2) {
                      if (parts.length === 2 && parts[1].length <= 2) {
                        setAmount(numericValue);
                      } else if (parts.length === 1) {
                        setAmount(numericValue);
                      }
                    }
                  }}
                  placeholder="0.00"
                  className="pl-8 text-lg font-medium"
                  required
                />
              </div>
            </div>

            {/* Payment Date - Fixed Calendar Popover with pointer-events-auto */}
            <div className="space-y-2">
              <Label className="text-gray-900">Payment Date *</Label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-300",
                      !paymentDate && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {/* CRITICAL FIX: Add pointer-events-auto wrapper to prevent auto-close */}
                  <div className="pointer-events-auto">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={(date) => {
                        if (date) {
                          setPaymentDate(date);
                          setShowDatePicker(false); // Close popover on select
                        }
                      }}
                      initialFocus
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="downpayment">Downpayment</SelectItem>
                    <SelectItem value="partial_payment">
                      Partial Payment
                    </SelectItem>
                    <SelectItem value="balance">Balance</SelectItem>
                    <SelectItem value="full">Full Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod" className="border-gray-300">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="maya">Maya</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
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
            {manualPaymentData.totalValue && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm border border-gray-200">
                <div className="font-medium text-gray-900 mb-2">
                  Payment Summary
                </div>
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
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span className="text-orange-600 font-medium">
                    {formatCurrency(manualPaymentData.remainingBalance || 0)}
                  </span>
                </div>
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
                        {paymentDate
                          ? format(paymentDate, "MMM dd, yyyy")
                          : "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">
                        {paymentType.replace("_", " ")}
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
                  disabled={isSubmitting}
                  className="min-w-[100px] border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    enteredAmount <= 0 ||
                    enteredAmount > maxAmount
                  }
                  className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                >
                  {isSubmitting ? (
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
