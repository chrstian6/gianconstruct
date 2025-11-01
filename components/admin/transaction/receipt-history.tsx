"use client";
import React, { useState, useEffect } from "react";
import { Calendar, Printer, Eye, Loader2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { InventoryPOSPayment } from "@/types/inventory-pos";
import { getFullInventoryPOSTransaction } from "@/action/inventoryPOS";

interface ReceiptHistoryProps {
  receipts: InventoryPOSPayment[];
  onPrint?: (receipt: InventoryPOSPayment) => void;
  onVoid?: (receiptId: string, reason: string, password: string) => void;
}

interface GroupedReceipts {
  [date: string]: InventoryPOSPayment[];
}

export function ReceiptHistory({
  receipts,
  onPrint,
  onVoid,
}: ReceiptHistoryProps) {
  const [selectedReceipt, setSelectedReceipt] =
    useState<InventoryPOSPayment | null>(null);
  const [groupedReceipts, setGroupedReceipts] = useState<GroupedReceipts>({});
  const [filteredReceipts, setFilteredReceipts] = useState<GroupedReceipts>({});
  const [filterDate, setFilterDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReceiptId, setVoidReceiptId] = useState<string>("");
  const [voidReason, setVoidReason] = useState("");
  const [voidPassword, setVoidPassword] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);

  // Group receipts by date
  useEffect(() => {
    const grouped: GroupedReceipts = {};

    receipts.forEach((receipt) => {
      const date = new Date(receipt.transactionDate)
        .toISOString()
        .split("T")[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(receipt);
    });

    // Sort dates in descending order
    const sortedGrouped = Object.keys(grouped)
      .sort()
      .reverse()
      .reduce((acc, date) => {
        acc[date] = grouped[date];
        return acc;
      }, {} as GroupedReceipts);

    setGroupedReceipts(sortedGrouped);

    // Filter by current date or most recent date
    const currentDate = new Date().toISOString().split("T")[0];
    if (sortedGrouped[currentDate]) {
      setFilteredReceipts({ [currentDate]: sortedGrouped[currentDate] });
    } else {
      // If no receipts for current date, show the most recent date
      const mostRecentDate = Object.keys(sortedGrouped)[0];
      if (mostRecentDate) {
        setFilterDate(mostRecentDate);
        setFilteredReceipts({
          [mostRecentDate]: sortedGrouped[mostRecentDate],
        });
      } else {
        setFilteredReceipts({});
      }
    }
  }, [receipts]);

  // Handle date filter
  const handleDateFilter = (date: string) => {
    setFilterDate(date);
    if (groupedReceipts[date]) {
      setFilteredReceipts({ [date]: groupedReceipts[date] });
    } else {
      setFilteredReceipts({});
    }
  };

  const handlePrint = (receipt: InventoryPOSPayment) => {
    if (onPrint) {
      onPrint(receipt);
    }
  };

  const handleVoid = (receiptId: string) => {
    setVoidReceiptId(receiptId);
    setVoidDialogOpen(true);
  };

  const handleVoidConfirm = async () => {
    if (!voidReason.trim()) {
      toast.error("Please provide a reason for voiding the receipt");
      return;
    }

    if (!voidPassword.trim()) {
      toast.error("Please enter your password to confirm voiding");
      return;
    }

    setIsVoiding(true);
    try {
      if (onVoid) {
        await onVoid(voidReceiptId, voidReason.trim(), voidPassword.trim());
      }
      setVoidDialogOpen(false);
      setVoidReason("");
      setVoidPassword("");
      setVoidReceiptId("");
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsVoiding(false);
    }
  };

  const handleViewDetails = async (receipt: InventoryPOSPayment) => {
    // If receipt doesn't have items or has incomplete data, load full details
    if (!receipt.items || receipt.items.length === 0 || !receipt.subtotal) {
      setIsLoading(true);
      try {
        const result = await getFullInventoryPOSTransaction(receipt.id);
        if (result.success && result.transaction) {
          setSelectedReceipt(result.transaction);
        } else {
          toast.error("Failed to load receipt details");
          setSelectedReceipt(receipt);
        }
      } catch (error) {
        toast.error("Error loading receipt details");
        setSelectedReceipt(receipt);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSelectedReceipt(receipt);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getDateOptions = () => {
    return Object.keys(groupedReceipts).map((date) => ({
      date,
      label: formatDate(date),
      count: groupedReceipts[date].length,
    }));
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusColors = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      voided: "bg-gray-100 text-gray-800 line-through",
    };

    const actualStatus = status || "completed";

    return (
      <Badge
        variant="secondary"
        className={`text-xs capitalize ${statusColors[actualStatus as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}
      >
        {actualStatus}
      </Badge>
    );
  };

  // Helper function to check if receipt is voided - FIXED VERSION
  const isVoided = (receipt: InventoryPOSPayment) => {
    // Check if status is explicitly "voided" OR if it's "failed" with VOIDED in notes
    return (
      receipt.status === "voided" ||
      (receipt.status === "failed" && receipt.notes?.includes("VOIDED"))
    );
  };

  // Helper function to get display status for voided receipts
  const getDisplayStatus = (receipt: InventoryPOSPayment) => {
    if (isVoided(receipt)) {
      return "voided";
    }
    return receipt.status || "completed";
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Receipts</p>
          <p className="text-2xl font-bold text-gray-900">{receipts.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Today</p>
          <p className="text-2xl font-bold text-green-600">
            {
              receipts.filter(
                (receipt) =>
                  new Date(receipt.transactionDate).toDateString() ===
                  new Date().toDateString()
              ).length
            }
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-600">
            ₱
            {receipts
              .filter((r) => !isVoided(r))
              .reduce((sum, receipt) => sum + receipt.totalAmount, 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Voided</p>
          <p className="text-2xl font-bold text-red-600">
            {receipts.filter((receipt) => isVoided(receipt)).length}
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Date
            </label>
            <select
              value={filterDate}
              onChange={(e) => handleDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {getDateOptions().map((option) => (
                <option key={option.date} value={option.date}>
                  {option.label} ({option.count} receipt
                  {option.count !== 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {Object.keys(filteredReceipts).length > 0 ? (
          Object.entries(filteredReceipts).map(([date, dateReceipts]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 sticky top-0">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {formatDate(date)}
                </h3>
              </div>

              {/* Receipts for this date */}
              <div className="divide-y divide-gray-200">
                {dateReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      isVoided(receipt) ? "bg-red-50 opacity-75" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p
                              className={`font-medium text-sm ${
                                isVoided(receipt)
                                  ? "text-gray-500 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {receipt.clientInfo.clientName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Ref: {receipt.referenceNumber}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-bold text-lg ${
                            isVoided(receipt)
                              ? "text-gray-500 line-through"
                              : "text-primary"
                          }`}
                        >
                          ₱{receipt.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(receipt.transactionDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2">
                        {/* Use display status instead of actual status */}
                        {getStatusBadge(getDisplayStatus(receipt))}
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {receipt.paymentType}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {receipt.paymentMethod}
                        </Badge>
                        {receipt.discountPercentage &&
                          receipt.discountPercentage > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {receipt.discountPercentage}% OFF
                            </Badge>
                          )}
                      </div>
                    </div>

                    {/* Receipt Summary */}
                    <div className="bg-gray-50 rounded p-3 mb-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Items:</span>
                          <span className="font-medium">
                            {receipt.items?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">
                            ₱
                            {receipt.subtotal?.toFixed(2) ||
                              receipt.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        {receipt.discountAmount &&
                          receipt.discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount:</span>
                              <span>-₱{receipt.discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                        {receipt.taxAmount && receipt.taxAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax:</span>
                            <span className="font-medium">
                              +₱{receipt.taxAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Item Details */}
                    {receipt.items && receipt.items.length > 0 && (
                      <div className="bg-blue-50 rounded p-3 mb-3 text-xs space-y-1 max-h-32 overflow-y-auto">
                        {receipt.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="text-gray-700 truncate">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-medium flex-shrink-0 ml-2">
                              ₱{item.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleViewDetails(receipt)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Eye className="h-3 w-3 mr-1" />
                        )}
                        View Details
                      </Button>
                      <Button
                        onClick={() => handlePrint(receipt)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        disabled={isVoided(receipt)}
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Print
                      </Button>
                      <Button
                        onClick={() => handleVoid(receipt.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isVoided(receipt)}
                      >
                        <Ban className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No receipts found for this date
            </p>
          </div>
        )}
      </div>

      {/* Void Receipt Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Void Receipt</DialogTitle>
            <DialogDescription>
              This action cannot be undone and will restore inventory
              quantities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="void-reason">Reason for voiding</Label>
              <Textarea
                id="void-reason"
                placeholder="Enter reason for voiding..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="void-password">Confirm Password</Label>
              <Input
                id="void-password"
                type="password"
                placeholder="Enter your password to confirm"
                value={voidPassword}
                onChange={(e) => setVoidPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVoidDialogOpen(false);
                setVoidReason("");
                setVoidPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoidConfirm}
              disabled={!voidReason.trim() || !voidPassword.trim() || isVoiding}
            >
              {isVoiding ? "Voiding..." : "Void Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Details Modal */}
      <Dialog
        open={!!selectedReceipt}
        onOpenChange={() => setSelectedReceipt(null)}
      >
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          {selectedReceipt && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Receipt Details {isVoided(selectedReceipt) && "(VOIDED)"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {/* Header */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p
                        className={`font-semibold ${
                          isVoided(selectedReceipt)
                            ? "text-gray-500 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {selectedReceipt.clientInfo.clientName}
                      </p>
                      <p className="text-gray-600">
                        Ref: {selectedReceipt.referenceNumber}
                      </p>
                      <p className="text-gray-600">
                        {new Date(
                          selectedReceipt.transactionDate
                        ).toLocaleString()}
                      </p>
                    </div>
                    {/* Use display status instead of actual status */}
                    {getStatusBadge(getDisplayStatus(selectedReceipt))}
                  </div>
                </div>

                {/* Client Info */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Client Information
                  </h4>
                  <div className="space-y-1 text-gray-600">
                    <p>
                      Email: {selectedReceipt.clientInfo.clientEmail || "N/A"}
                    </p>
                    <p>
                      Phone: {selectedReceipt.clientInfo.clientPhone || "N/A"}
                    </p>
                    <p>
                      Address:{" "}
                      {selectedReceipt.clientInfo.clientAddress || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Items ({selectedReceipt.items?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {selectedReceipt.items &&
                    selectedReceipt.items.length > 0 ? (
                      selectedReceipt.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <span className="font-medium">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-gray-600 text-xs block">
                              @ ₱{item.unitPrice.toFixed(2)}/
                              {item.unit || "pcs"}
                            </span>
                          </div>
                          <span className="font-medium">
                            ₱{item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No item details available
                      </p>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-b pb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        ₱
                        {selectedReceipt.subtotal?.toFixed(2) ||
                          selectedReceipt.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    {selectedReceipt.discountAmount &&
                      selectedReceipt.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>
                            Discount ({selectedReceipt.discountPercentage}%):
                          </span>
                          <span>
                            -₱{selectedReceipt.discountAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    {selectedReceipt.taxAmount &&
                      selectedReceipt.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Tax ({selectedReceipt.taxPercentage}%):</span>
                          <span>+₱{selectedReceipt.taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span
                        className={
                          isVoided(selectedReceipt)
                            ? "line-through text-gray-500"
                            : ""
                        }
                      >
                        ₱{selectedReceipt.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Payment Information
                  </h4>
                  <div className="space-y-1 text-gray-600">
                    <p>
                      Payment Method:{" "}
                      <span className="capitalize font-medium">
                        {selectedReceipt.paymentMethod}
                      </span>
                    </p>
                    <p>
                      Payment Type:{" "}
                      <span className="capitalize font-medium">
                        {selectedReceipt.paymentType}
                      </span>
                    </p>
                    <p>
                      Amount Paid: ₱
                      {selectedReceipt.amountPaid?.toFixed(2) ||
                        selectedReceipt.totalAmount.toFixed(2)}
                    </p>
                    <p>
                      Change: ₱{selectedReceipt.change?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>

                {/* Void Reason (if voided) */}
                {isVoided(selectedReceipt) && selectedReceipt.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Void Information
                    </h4>
                    <div className="bg-red-50 rounded p-3">
                      <p className="text-red-700 text-sm">
                        <strong>Reason:</strong> {selectedReceipt.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    handlePrint(selectedReceipt);
                    setSelectedReceipt(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isVoided(selectedReceipt)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                {!isVoided(selectedReceipt) && (
                  <Button
                    onClick={() => {
                      handleVoid(selectedReceipt.id);
                      setSelectedReceipt(null);
                    }}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Void Receipt
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
