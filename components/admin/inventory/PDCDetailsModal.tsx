// components/admin/inventory/PDCDetailsModal.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { PDCWithItems } from "@/types/pdc";
import { format } from "date-fns";
import {
  Clock,
  CheckSquare,
  XCircle,
  X,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Building,
  Hash,
  ChevronLeft,
  ChevronRight,
  Layers,
  Calculator,
  Truck,
  MapPin,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { useEffect } from "react";

interface PDCDetailsModalProps {
  pdc: PDCWithItems;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onMarkIssued: (pdc_id: string) => void;
}

// Convert number to words
const numberToWords = (num: number): string => {
  const ones = [
    "",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "FIVE",
    "SIX",
    "SEVEN",
    "EIGHT",
    "NINE",
  ];
  const teens = [
    "TEN",
    "ELEVEN",
    "TWELVE",
    "THIRTEEN",
    "FOURTEEN",
    "FIFTEEN",
    "SIXTEEN",
    "SEVENTEEN",
    "EIGHTEEN",
    "NINETEEN",
  ];
  const tens = [
    "",
    "",
    "TWENTY",
    "THIRTY",
    "FORTY",
    "FIFTY",
    "SIXTY",
    "SEVENTY",
    "EIGHTY",
    "NINETY",
  ];
  const thousands = ["", "THOUSAND", "MILLION", "BILLION"];

  if (num === 0) return "ZERO";

  const parts = [];
  let groupIndex = 0;

  while (num > 0) {
    const group = num % 1000;
    if (group !== 0) {
      let groupWords = "";
      const hundreds = Math.floor(group / 100);
      const remainder = group % 100;

      if (hundreds > 0) {
        groupWords += ones[hundreds] + " HUNDRED ";
      }

      if (remainder >= 20) {
        const tenDigit = Math.floor(remainder / 10);
        const oneDigit = remainder % 10;
        groupWords += tens[tenDigit];
        if (oneDigit > 0) {
          groupWords += " " + ones[oneDigit];
        }
      } else if (remainder >= 10) {
        groupWords += teens[remainder - 10];
      } else if (remainder > 0) {
        groupWords += ones[remainder];
      }

      if (groupIndex > 0) {
        groupWords += " " + thousands[groupIndex];
      }

      parts.unshift(groupWords);
    }
    num = Math.floor(num / 1000);
    groupIndex++;
  }

  return parts.join(" ");
};

export function PDCDetailsModal({
  pdc,
  isOpen,
  onClose,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
  onMarkIssued,
}: PDCDetailsModalProps) {
  // Handle background scroll lock and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.cssText = `position: fixed; top: -${scrollY}px; width: 100%; overflow: hidden;`;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && hasNext && onNext) onNext();
      else if (e.key === "ArrowLeft" && hasPrev && onPrev) onPrev();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.cssText = "";
      window.scrollTo(0, scrollY);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!isOpen) return null;

  const statusInfo =
    pdc.status === "pending"
      ? {
          text: "Pending",
          variant: "secondary" as const,
          icon: Clock,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
        }
      : pdc.status === "issued"
        ? {
            text: "Issued",
            variant: "default" as const,
            icon: CheckSquare,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
            borderColor: "border-emerald-200",
          }
        : {
            text: "Cancelled",
            variant: "destructive" as const,
            icon: XCircle,
            color: "text-rose-600",
            bgColor: "bg-rose-50",
            borderColor: "border-rose-200",
          };

  const StatusIcon = statusInfo.icon;
  const amountInWords = numberToWords(Math.floor(pdc.totalAmount));

  const NavButton = ({
    onClick,
    direction,
    disabled = false,
  }: {
    onClick: () => void;
    direction: "left" | "right";
    disabled?: boolean;
  }) => (
    <Button
      variant="secondary"
      size="icon"
      className={`absolute ${direction === "left" ? "-left-12" : "-right-12"} z-10 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-700`}
      onClick={onClick}
      disabled={disabled}
    >
      {direction === "left" ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-6xl w-full mx-4 max-h-screen flex items-center justify-center">
        {/* Close Button - Top Right */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute -top-8 right-0 z-10 h-6 w-6 rounded-full bg-white/90 hover:bg-white text-gray-700"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Navigation Buttons */}
        {hasPrev && onPrev && <NavButton onClick={onPrev} direction="left" />}
        {hasNext && onNext && <NavButton onClick={onNext} direction="right" />}

        {/* Modal Content */}
        <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">PDC Details</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="font-mono">{pdc.checkNumber}</span>
                  </div>
                  <span>•</span>
                  <span>{pdc.supplier}</span>
                </div>
              </div>
              <Badge
                variant={statusInfo.variant}
                className={`${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor} border font-medium`}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.text}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Key Information Grid - Similar to InventoryDetailsCard layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Check Information Card */}
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Check Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Check Number
                        </span>
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {pdc.checkNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bank</span>
                        <span className="text-sm font-medium text-gray-900">
                          Chinabank
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Account Name
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          EDNA B. SEGUIRO
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Amount in Words
                      </Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">
                          {amountInWords} PESOS ONLY
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Summary Card */}
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Check Date</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900 mt-1">
                            {format(new Date(pdc.checkDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-50">
                          <Calendar className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            <span>Total Amount</span>
                          </div>
                          <p className="text-lg font-semibold text-emerald-700 mt-1">
                            ₱{pdc.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50">
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Package className="h-4 w-4" />
                            <span>Total Items</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900 mt-1">
                            {pdc.itemCount} items
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Supplier & Timeline Card */}
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Supplier & Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Building className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {pdc.supplier}
                        </p>
                        <p className="text-xs text-gray-600">Vendor</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full mt-0.5"></div>
                          <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium text-gray-900">
                            Created
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {format(
                              new Date(pdc.createdAt),
                              "MMM dd, yyyy HH:mm"
                            )}
                          </p>
                        </div>
                      </div>
                      {pdc.issuedAt && (
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-0.5"></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Issued
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {format(
                                new Date(pdc.issuedAt),
                                "MMM dd, yyyy HH:mm"
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Items Table Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Items Details
                  </h4>
                  <Badge variant="outline" className="font-normal">
                    {pdc.itemCount} items
                  </Badge>
                </div>

                <Card className="border border-gray-200 shadow-none">
                  <CardContent className="p-0">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader className="bg-gray-50 sticky top-0">
                            <TableRow className="hover:bg-transparent border-b border-gray-200">
                              <TableHead className="h-10 text-xs font-semibold text-gray-700 sticky left-0 bg-gray-50 w-12">
                                No.
                              </TableHead>
                              <TableHead className="h-10 text-xs font-semibold text-gray-700 min-w-[200px]">
                                Item Name
                              </TableHead>
                              <TableHead className="h-10 text-xs font-semibold text-gray-700 min-w-[120px]">
                                Category
                              </TableHead>
                              <TableHead className="h-10 text-xs font-semibold text-gray-700 text-center w-16">
                                Qty
                              </TableHead>
                              <TableHead className="h-10 text-xs font-semibold text-gray-700 text-center w-16">
                                Unit
                              </TableHead>
                              <TableHead className="h-10 text-xs font-semibold text-gray-700 text-right min-w-[100px]">
                                Unit Cost
                              </TableHead>
                              <TableHead className="h-10 text-xs font-semibold text-gray-700 text-right min-w-[100px]">
                                Total
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pdc.itemDetails && pdc.itemDetails.length > 0 ? (
                              pdc.itemDetails.map((item, index) => (
                                <TableRow
                                  key={index}
                                  className="border-b border-gray-100 hover:bg-gray-50/50"
                                >
                                  <TableCell className="py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white w-12">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell className="py-3 min-w-[200px]">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 min-w-[120px]">
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-normal border-gray-300 text-gray-700"
                                    >
                                      {item.category}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3 text-center w-16">
                                    <div className="text-sm text-gray-900 font-medium">
                                      {item.quantity}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 text-center w-16">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs font-normal bg-gray-100 text-gray-700"
                                    >
                                      {item.unit}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3 text-right min-w-[100px]">
                                    <div className="text-sm text-gray-900">
                                      ₱{item.unitCost.toLocaleString()}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 text-right min-w-[100px]">
                                    <div className="text-sm font-semibold text-emerald-700">
                                      ₱
                                      {(
                                        item.quantity * item.unitCost
                                      ).toLocaleString()}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="py-8 text-center"
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <Package className="h-8 w-8 text-gray-300" />
                                    <p className="text-gray-500">
                                      No item details available
                                    </p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Total Row */}
                    {pdc.itemDetails && pdc.itemDetails.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-900">
                              Grand Total
                            </span>
                          </div>
                          <div className="text-lg font-semibold text-emerald-700">
                            ₱{pdc.totalAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notes Section (if exists) */}
              {pdc.notes && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h4>
                  <Card className="border border-gray-200 shadow-none">
                    <CardContent className="p-4">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {pdc.notes}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Additional Information - Bottom Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <label className="text-xs font-medium text-gray-500 block">
                    Status
                  </label>
                  <Badge variant={statusInfo.variant} className="text-xs mt-1">
                    {statusInfo.text}
                  </Badge>
                </div>
                <div className="text-center">
                  <label className="text-xs font-medium text-gray-500 block">
                    PDC ID
                  </label>
                  <p className="text-xs font-medium text-gray-900 font-mono truncate">
                    {pdc.pdc_id.slice(0, 12)}...
                  </p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-medium text-gray-500 block">
                    Check Date
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(pdc.checkDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-medium text-gray-500 block">
                    Created
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(pdc.createdAt), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Supplier:</span>{" "}
                <span className="text-gray-900">{pdc.supplier}</span>
              </div>
              <div className="flex gap-3">
                {pdc.status === "pending" && (
                  <Button
                    onClick={() => onMarkIssued(pdc.pdc_id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Mark as Issued
                  </Button>
                )}
                <Button onClick={onClose} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
