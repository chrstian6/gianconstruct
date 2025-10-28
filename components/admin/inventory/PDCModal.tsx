// components/admin/inventory/PDCModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Banknote, Info } from "lucide-react";
import { PDCData } from "./AddItemModal";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createPDC } from "@/action/pdc";
import { toast } from "sonner";

interface PDCModalProps {
  showPDCModal: boolean;
  pdcData: PDCData;
  setPdcData: React.Dispatch<React.SetStateAction<PDCData>>;
  onConfirm: () => void; // This should only handle closing/reset, NOT PDC creation
  onCancel: () => void;
  itemsList?: string[];
  inventoryItems?: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unitCost: number;
    unit: string;
    category: string;
  }>;
  batchMode?: boolean;
}

export function PDCModal({
  showPDCModal,
  pdcData,
  setPdcData,
  onConfirm,
  onCancel,
  itemsList = [],
  inventoryItems = [],
  batchMode = false,
}: PDCModalProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  if (!showPDCModal) return null;

  const handleDateSelect = (date: Date | undefined) => {
    setPdcData((prev) => ({ ...prev, checkDate: date }));
    setCalendarOpen(false);
  };

  // Generate items description for payee field
  const getItemsDescription = () => {
    if (itemsList.length > 0) {
      if (itemsList.length <= 3) {
        return `Inventory Items: ${itemsList.join(", ")}`;
      } else {
        return `Inventory Items: ${itemsList.slice(0, 3).join(", ")} and ${itemsList.length - 3} more`;
      }
    }
    return `Inventory Purchase - ${pdcData.itemCount} item${pdcData.itemCount !== 1 ? "s" : ""}`;
  };

  // Create PDC items for database
  const createPDCItems = () => {
    return inventoryItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCapital: item.quantity * item.unitCost,
    }));
  };

  // Handle PDC confirmation with database recording
  const handlePDCConfirm = async () => {
    if (!pdcData.checkDate) {
      toast.error("Please select a check date");
      return;
    }

    setIsRecording(true);

    try {
      // Create PDC record in database
      const pdcRecord = {
        checkDate: pdcData.checkDate,
        supplier: pdcData.supplier,
        totalAmount: pdcData.totalAmount,
        itemCount: pdcData.itemCount,
        payee: pdcData.payee,
        amountInWords: pdcData.amountInWords,
        items: createPDCItems(),
        status: "pending" as const,
        notes: `Inventory purchase for ${pdcData.itemCount} item${pdcData.itemCount !== 1 ? "s" : ""} from ${pdcData.supplier}`,
      };

      const result = await createPDC(pdcRecord);

      if (result.success && result.pdc) {
        toast.success("PDC recorded successfully");

        // ONLY call onConfirm to handle modal close and reset
        // DO NOT create PDC again in the parent
        onConfirm();
      } else {
        toast.error(result.error || "Failed to record PDC");
      }
    } catch (error) {
      console.error("Error creating PDC:", error);
      toast.error("Failed to record PDC");
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 border-2 border-red-600 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Modal Header - Compact */}
        <div className="bg-red-600 text-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              <div>
                <h3 className="text-md font-bold">CHINA BANKING CORPORATION</h3>
                <p className="text-xs text-red-200">
                  Post Dated Check - Tracking Document
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono">
                REF: CBC-{Date.now().toString().slice(-6)}
              </p>
              <p className="text-xs text-red-200">For Tracking Purposes</p>
            </div>
          </div>
        </div>

        {/* Important Disclaimer */}
        <div className="bg-amber-50 border-b border-amber-200 p-2">
          <div className="flex items-center gap-2 text-amber-800">
            <Info className="h-4 w-4 flex-shrink-0" />
            <p className="text-xs font-medium">
              <strong>NOTE:</strong> This is not an actual bank check. This is a
              tracking document for internal accounting purposes only.
            </p>
          </div>
        </div>

        {/* Check Design - Compact Horizontal Layout */}
        <div className="p-4 flex-1 overflow-auto">
          {/* Check Container */}
          <div className="border-2 border-gray-400 bg-white mb-4">
            {/* Bank Header Strip */}
            <div className="bg-red-600 text-white py-1 px-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-xs">CBC</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold font-serif">CHINA BANK</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs">1564-00-00256-8</p>
              </div>
            </div>

            {/* Check Body - Compact Horizontal Layout */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Left Column - Payee Information */}
                <div className="col-span-2 space-y-3">
                  {/* Date */}
                  <div className="flex items-center gap-3">
                    <Label className="text-xs font-bold text-gray-700 min-w-[60px]">
                      DATE
                    </Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal border border-gray-400 bg-white py-1 h-8 text-sm",
                            !pdcData.checkDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {pdcData.checkDate ? (
                            format(pdcData.checkDate, "MMM dd, yyyy")
                          ) : (
                            <span>Select date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 z-[100]"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={pdcData.checkDate}
                          onSelect={handleDateSelect}
                          initialFocus
                          className="p-2 pointer-events-auto"
                          classNames={{
                            day_selected:
                              "bg-red-600 text-white hover:bg-red-700 hover:text-white",
                            day_today: "bg-accent text-accent-foreground",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Pay to the Order Of - NOW SHOWING ITEMS */}
                  <div>
                    <Label className="text-xs font-bold text-gray-700 block mb-1">
                      PAY TO THE ORDER OF
                    </Label>
                    <div className="border-b border-gray-800 pb-1 min-h-[32px]">
                      <p className="text-sm font-semibold text-gray-900">
                        {getItemsDescription()}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Supplier: {pdcData.supplier}
                    </p>
                  </div>

                  {/* Amount in Words */}
                  <div>
                    <Label className="text-xs font-bold text-gray-700 block mb-1">
                      AMOUNT IN WORDS
                    </Label>
                    <div className="border-b border-gray-400 pb-1 min-h-[40px]">
                      <p className="text-xs text-gray-700 leading-tight italic">
                        {pdcData.amountInWords}
                      </p>
                    </div>
                  </div>

                  {/* Signature Line */}
                  <div className="mt-4">
                    <div className="border-t border-gray-400 pt-1 text-center">
                      <p className="text-xs text-gray-600">
                        Authorized Signature - For Tracking
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Amount and Details */}
                <div className="space-y-3">
                  {/* Amount Box */}
                  <div className="border-2 border-gray-800 p-2 text-center bg-gray-50">
                    <Label className="text-xs font-bold text-gray-600 block mb-1">
                      AMOUNT
                    </Label>
                    <div className="text-xl font-bold text-red-700 font-mono">
                      ₱
                      {pdcData.totalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  {/* Account Holder */}
                  <div className="bg-blue-50 p-2 border border-blue-200 rounded">
                    <Label className="text-xs font-bold text-blue-800 block mb-1">
                      ACCOUNT HOLDER
                    </Label>
                    <p className="text-xs font-semibold text-blue-900">
                      EDNA B. SEGUIRO
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      1564-00-00256-8
                    </p>
                  </div>

                  {/* Items Count */}
                  <div className="bg-green-50 p-2 border border-green-200 rounded">
                    <Label className="text-xs font-bold text-green-800 block mb-1">
                      ITEMS COUNT
                    </Label>
                    <p className="text-lg font-bold text-green-900 text-center">
                      {pdcData.itemCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="mt-4 pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-200 px-1 py-0.5 rounded text-xs">
                      FOR TRACKING ONLY
                    </div>
                    <div className="text-amber-600 font-medium">
                      NOT NEGOTIABLE
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs">
                      REF-{Date.now().toString().slice(-6)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Transaction Summary */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
            <h4 className="font-bold text-xs mb-2 text-gray-800 flex items-center gap-1">
              <Banknote className="h-3 w-3" />
              Transaction Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-600">Supplier:</span>
                <p className="font-medium text-gray-900 truncate">
                  {pdcData.supplier}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Items Count:</span>
                <p className="font-medium text-gray-900">{pdcData.itemCount}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Amount:</span>
                <p className="font-medium text-green-700">
                  ₱
                  {pdcData.totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Document Type:</span>
                <p className="font-medium text-blue-700">Tracking PDC</p>
              </div>
            </div>

            {/* Items List (if available) */}
            {itemsList.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-600 text-xs">Items:</span>
                <p className="text-xs text-gray-700 mt-1 line-clamp-2">
                  {itemsList.join(", ")}
                </p>
              </div>
            )}

            {/* Database Recording Info */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <Info className="h-3 w-3" />
                <span>
                  This transaction will be recorded in PDC history for tracking.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions - Compact */}
        <div className="flex gap-2 p-3 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isRecording}
            className="flex-1 border-gray-400 text-gray-700 hover:bg-gray-200 py-1 h-9 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePDCConfirm}
            disabled={!pdcData.checkDate || isRecording}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-1 h-9 text-sm"
          >
            <Banknote className="mr-1 h-3 w-3" />
            {isRecording ? "Recording..." : "Confirm & Record"}
          </Button>
        </div>
      </div>
    </div>
  );
}
