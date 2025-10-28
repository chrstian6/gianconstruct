// components/admin/inventory/tabs/PDCTab.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PDCWithItems } from "@/types/pdc";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Banknote,
  Clock,
  CheckSquare,
  XCircle,
  Eye,
  X,
} from "lucide-react";

interface PDCTabProps {
  pdcs: PDCWithItems[];
  pdcStats: any;
  pdcsLoading: boolean;
  pdcSearchTerm: string;
  setPdcSearchTerm: (term: string) => void;
  pdcStatusFilter: "all" | "pending" | "issued" | "cancelled";
  setPdcStatusFilter: (
    filter: "all" | "pending" | "issued" | "cancelled"
  ) => void;
  isPDCFilterOpen: boolean;
  setIsPDCFilterOpen: (open: boolean) => void;
  hasPDCActiveFilters: boolean;
  pdcCurrentPage: number;
  pdcItemsPerPage: number;
  filteredPDCs: PDCWithItems[];
  onViewPDCDetails: (pdc: PDCWithItems) => void;
  onMarkAsIssued: (pdc_id: string) => void;
  onPDCDeleteClick: (pdc: PDCWithItems) => void;
  onClearPDCFilters: () => void;
  setPdcCurrentPage: (page: number) => void;
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

export function PDCTab({
  pdcs,
  pdcStats,
  pdcsLoading,
  pdcSearchTerm,
  setPdcSearchTerm,
  pdcStatusFilter,
  setPdcStatusFilter,
  isPDCFilterOpen,
  setIsPDCFilterOpen,
  hasPDCActiveFilters,
  pdcCurrentPage,
  pdcItemsPerPage,
  filteredPDCs,
  onViewPDCDetails,
  onMarkAsIssued,
  onPDCDeleteClick,
  onClearPDCFilters,
  setPdcCurrentPage,
}: PDCTabProps) {
  // Get status information for PDC
  const getPDCStatusInfo = (pdc: PDCWithItems) => {
    switch (pdc.status) {
      case "pending":
        return { text: "Pending", variant: "secondary" as const, icon: Clock };
      case "issued":
        return {
          text: "Issued",
          variant: "default" as const,
          icon: CheckSquare,
        };
      case "cancelled":
        return {
          text: "Cancelled",
          variant: "destructive" as const,
          icon: XCircle,
        };
      default:
        return { text: "Unknown", variant: "secondary" as const, icon: Clock };
    }
  };

  // Fixed pagination handlers
  const handlePreviousPage = () => {
    setPdcCurrentPage(Math.max(pdcCurrentPage - 1, 1));
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(filteredPDCs.length / pdcItemsPerPage);
    if (pdcCurrentPage < totalPages) {
      setPdcCurrentPage(pdcCurrentPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* PDC Stats Cards */}
      {pdcStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Total PDCs</span>
              </div>
              <p className="text-2xl font-bold mt-2">{pdcStats.total}</p>
              <p className="text-xs text-gray-600">All PDC records</p>
            </CardContent>
          </Card>

          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold mt-2">{pdcStats.pending}</p>
              <p className="text-xs text-gray-600">Awaiting issuance</p>
            </CardContent>
          </Card>

          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Issued</span>
              </div>
              <p className="text-2xl font-bold mt-2">{pdcStats.issued}</p>
              <p className="text-xs text-gray-600">Completed PDCs</p>
            </CardContent>
          </Card>

          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Total Amount</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                ₱{pdcStats.totalAmount?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-gray-600">Total PDC value</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PDC List */}
      <Card className="w-full rounded-sm shadow-none border">
        <CardHeader>
          <CardTitle className="text-foreground-900 font-geist">
            Post Dated Checks
          </CardTitle>
          <CardDescription className="font-geist">
            Manage and track all post dated checks for inventory purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search PDCs by check number, supplier..."
                value={pdcSearchTerm}
                onChange={(e) => setPdcSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu
              open={isPDCFilterOpen}
              onOpenChange={setIsPDCFilterOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Status: {pdcStatusFilter === "all" ? "All" : pdcStatusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setPdcStatusFilter("all")}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPdcStatusFilter("pending")}
                  >
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPdcStatusFilter("issued")}
                  >
                    Issued
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPdcStatusFilter("cancelled")}
                  >
                    Cancelled
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {hasPDCActiveFilters && (
              <Button variant="outline" onClick={onClearPDCFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* PDC Table */}
          {pdcsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading PDCs...</p>
            </div>
          ) : filteredPDCs.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 font-geist mb-2">
                No PDCs Found
              </h3>
              <p className="text-gray-600 font-geist max-w-md mx-auto">
                {hasPDCActiveFilters
                  ? "No PDCs match your current filters. Try adjusting your search criteria."
                  : "No post dated checks have been recorded yet. PDCs will appear here when you add inventory items with suppliers."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPDCs
                .slice(
                  (pdcCurrentPage - 1) * pdcItemsPerPage,
                  pdcCurrentPage * pdcItemsPerPage
                )
                .map((pdc) => {
                  const statusInfo = getPDCStatusInfo(pdc);
                  const StatusIcon = statusInfo.icon;
                  const amountInWords = numberToWords(
                    Math.floor(pdc.totalAmount)
                  );
                  const itemsList =
                    pdc.itemDetails && pdc.itemDetails.length > 0
                      ? pdc.itemDetails
                          .map(
                            (item) =>
                              `${item.name} (${item.quantity} ${item.unit})`
                          )
                          .join(", ")
                      : "Inventory Purchase";

                  return (
                    <div
                      key={pdc.pdc_id}
                      className="relative bg-white border-t-2 border-red-600 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Cheque Top Section - ChinaBank Red Header */}
                      <div className="bg-red-600 text-white px-3 py-2 flex justify-between items-center border-b-2 border-red-600">
                        <div className="text-xs font-bold tracking-wider">
                          CHINABANK CHECK
                        </div>
                        <Badge
                          variant={statusInfo.variant}
                          className="flex items-center gap-1 text-xs h-6"
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.text}
                        </Badge>
                      </div>

                      {/* Cheque Main Content */}
                      <div className="px-3 py-2 space-y-2">
                        {/* Row 1: Check Number and Date */}
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 font-semibold">
                              Check No.
                            </p>
                            <p className="text-base font-bold text-gray-900 font-mono">
                              {pdc.checkNumber || "—"}
                            </p>
                          </div>
                          <div className="flex-1 text-right">
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
                                      char === "/"
                                        ? ""
                                        : "border border-gray-400"
                                    }`}
                                  >
                                    {char}
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Pay to Order of - Items List */}
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">
                            Pay to the Order of
                          </p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {itemsList}
                          </p>
                        </div>

                        {/* Row 3: Amount in Words and Amount Box */}
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 font-semibold">
                              Amount
                            </p>
                            <p className="text-sm font-medium text-gray-700 line-clamp-1">
                              {amountInWords} PESOS ONLY
                            </p>
                          </div>
                          <div className="flex-shrink-0 border-2 border-gray-300 rounded-sm p-2 text-right bg-gray-50 min-w-fit">
                            <p className="text-lg font-medium text-black font-mono">
                              ₱{pdc.totalAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Row 4: Payee */}
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">
                            Account Name
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            EDNA B. SEGUIRO
                          </p>
                        </div>

                        {/* Row 5: Supplier Reference */}
                        <div className="text-xs text-gray-500 italic line-clamp-1">
                          Supplier: {pdc.supplier}
                        </div>
                      </div>

                      {/* Action Buttons - Fixed at Bottom Right */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewPDCDetails(pdc)}
                          className="text-xs h-7 px-2 border-red-300 hover:border-red-600"
                        >
                          <Eye className="h-3 w-3 mr-0.5" />
                          View
                        </Button>

                        {pdc.status === "pending" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onMarkAsIssued(pdc.pdc_id)}
                            className="text-xs h-7 px-2 bg-red-600 hover:bg-red-700"
                          >
                            <CheckSquare className="h-3 w-3 mr-0.5" />
                            Issue
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPDCDeleteClick(pdc)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

              {/* Pagination */}
              {filteredPDCs.length > pdcItemsPerPage && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {(pdcCurrentPage - 1) * pdcItemsPerPage + 1} to{" "}
                    {Math.min(
                      pdcCurrentPage * pdcItemsPerPage,
                      filteredPDCs.length
                    )}{" "}
                    of {filteredPDCs.length} PDCs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={pdcCurrentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={
                        pdcCurrentPage >=
                        Math.ceil(filteredPDCs.length / pdcItemsPerPage)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
