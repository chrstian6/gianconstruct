// components/admin/inventory/PDCDetailsModal.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { PDCWithItems } from "@/types/pdc";
import { format } from "date-fns";
import { Clock, CheckSquare, XCircle, X } from "lucide-react";

interface PDCDetailsModalProps {
  pdc: PDCWithItems;
  isOpen: boolean;
  onClose: () => void;
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

  let parts = [];
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
  onMarkIssued,
}: PDCDetailsModalProps) {
  if (!isOpen) return null;

  const statusInfo =
    pdc.status === "pending"
      ? { text: "Pending", variant: "secondary" as const, icon: Clock }
      : pdc.status === "issued"
        ? { text: "Issued", variant: "default" as const, icon: CheckSquare }
        : { text: "Cancelled", variant: "destructive" as const, icon: XCircle };

  const StatusIcon = statusInfo.icon;
  const amountInWords = numberToWords(Math.floor(pdc.totalAmount));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col border-t-2 border-red-600">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-geist">PDC Details</h2>
            <p className="text-red-100 text-sm">Check No. {pdc.checkNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={statusInfo.variant}
              className="flex items-center gap-1"
            >
              <StatusIcon className="h-3 w-3" />
              {statusInfo.text}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-white text-red-600 hover:bg-red-50 border-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Cheque Display */}
            <div className="bg-gradient-to-b from-blue-50 to-white border-2 border-gray-300 rounded-sm p-4 space-y-3">
              {/* Header */}
              <div className="bg-red-600 text-white px-3 py-2 flex justify-between items-center rounded-sm -m-4 mb-3">
                <div className="text-xs font-bold tracking-wider">
                  CHINABANK CHECK
                </div>
              </div>

              {/* Check Number and Date */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">
                    Check No.
                  </p>
                  <p className="text-lg font-bold text-gray-900 font-mono">
                    {pdc.checkNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-semibold mb-1">
                    Date
                  </p>
                  <div className="flex justify-end gap-1">
                    {format(new Date(pdc.checkDate), "MM/dd/yyyy")
                      .split("")
                      .map((char, idx) => (
                        <div
                          key={idx}
                          className={`w-5 h-6 flex items-center justify-center text-xs font-bold text-gray-900 ${
                            char === "/" ? "" : "border border-gray-400"
                          }`}
                        >
                          {char}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-gray-300"></div>

              {/* Items List */}
              <div>
                <p className="text-xs text-gray-600 font-semibold">
                  Pay to the Order of
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {pdc.itemDetails && pdc.itemDetails.length > 0
                    ? pdc.itemDetails
                        .slice(0, 3)
                        .map((item) => item.name)
                        .join(", ") +
                      (pdc.itemDetails.length > 3
                        ? ` + ${pdc.itemDetails.length - 3} more`
                        : "")
                    : "Inventory Purchase"}
                </p>
              </div>

              {/* Amount in Words and Numeric */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-semibold">Amount</p>
                  <p className="text-xs font-medium text-gray-700">
                    {amountInWords} PESOS ONLY
                  </p>
                </div>
                <div className="flex-shrink-0 border-2 border-gray-300 rounded-sm p-2 text-right bg-gray-50 min-w-fit">
                  <p className="text-lg font-bold text-black font-mono">
                    ₱{pdc.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Account Name and Supplier */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">
                    Account Name
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    EDNA B. SEGUIRO
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">
                    Supplier
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {pdc.supplier}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Check Information */}
              <Card className="rounded-sm border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Check Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <Label className="text-xs text-gray-600">Check Date</Label>
                    <p className="font-medium">
                      {format(new Date(pdc.checkDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">
                      Total Amount
                    </Label>
                    <p className="font-bold text-green-700">
                      ₱{pdc.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Item Count</Label>
                    <p className="font-medium">{pdc.itemCount} items</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Status</Label>
                    <Badge variant={statusInfo.variant} className="mt-1">
                      {statusInfo.text}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="rounded-sm border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div className="text-sm">
                      <p className="font-medium">Created</p>
                      <p className="text-xs text-gray-600">
                        {format(new Date(pdc.createdAt), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  {pdc.issuedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="text-sm">
                        <p className="font-medium">Issued</p>
                        <p className="text-xs text-gray-600">
                          {format(new Date(pdc.issuedAt), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="rounded-sm border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pdc.status === "pending" && (
                    <Button
                      onClick={() => onMarkIssued(pdc.pdc_id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Mark as Issued
                    </Button>
                  )}
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full"
                  >
                    Close
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Items Table */}
            <Card className="rounded-sm border">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Items Details ({pdc.itemCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">
                          No.
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">
                          Item Name
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">
                          Category
                        </th>
                        <th className="text-center px-3 py-2 font-semibold text-gray-700">
                          Qty
                        </th>
                        <th className="text-center px-3 py-2 font-semibold text-gray-700">
                          Unit
                        </th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-700">
                          Unit Cost
                        </th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-700">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pdc.itemDetails && pdc.itemDetails.length > 0 ? (
                        pdc.itemDetails.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {item.category}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-700">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-700">
                              {item.unit}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700">
                              ₱{item.unitCost.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-green-700">
                              ₱
                              {(item.quantity * item.unitCost).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 py-4 text-center text-gray-600"
                          >
                            No item details available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {pdc.notes && (
              <Card className="rounded-sm border">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{pdc.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
