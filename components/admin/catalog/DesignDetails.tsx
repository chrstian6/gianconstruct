import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  Trash2,
  Pencil,
  MoreHorizontal,
  DollarSign,
  ChevronRight,
  ChevronLeftIcon,
} from "lucide-react";
import { Design } from "@/types/design";
import { useModalStore } from "@/lib/stores";
import { deleteDesign } from "@/action/designs";
import { toast } from "sonner";
import { calculatePaymentSchedule, formatCurrency } from "@/lib/amortization";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DesignDetailsProps {
  design: Design;
  onBack: () => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

export default function DesignDetails({
  design,
  onBack,
  onDelete,
  onEdit,
}: DesignDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showLoanDetails, setShowLoanDetails] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { isDeleteDesignOpen, setIsDeleteDesignOpen } = useModalStore();

  const ITEMS_PER_PAGE = 12;

  const capitalizeWords = (str: string | undefined): string => {
    if (!str) return "Unknown";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatSquareMeters = (square_meters: number): string => {
    return `${square_meters.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} sqm`;
  };

  const handlePrevImage = () => {
    setIsAnimating(true);
    setCurrentImageIndex((prev) =>
      prev === 0 ? design.images.length - 1 : prev - 1
    );
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleNextImage = () => {
    setIsAnimating(true);
    setCurrentImageIndex((prev) =>
      prev === design.images.length - 1 ? 0 : prev + 1
    );
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleThumbnailClick = (index: number) => {
    setIsAnimating(true);
    setCurrentImageIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleConfirmDelete = async () => {
    const result = await deleteDesign(design.design_id);
    if (result?.success) {
      onDelete(design.design_id);
      toast.success("Design deleted successfully!");
      setIsDeleteDesignOpen(false);
      onBack();
    } else {
      toast.error(result?.error || "Failed to delete design");
      setIsDeleteDesignOpen(false);
    }
  };

  // Calculate payment schedule with proper validation and null checks
  const paymentSchedule =
    design.isLoanOffer &&
    design.maxLoanTerm !== undefined &&
    design.maxLoanTerm !== null &&
    design.maxLoanTerm > 0 &&
    design.interestRate !== undefined &&
    design.interestRate !== null &&
    design.interestRate >= 0
      ? calculatePaymentSchedule(
          design.price,
          design.maxLoanTerm, // Already stored as months in database
          design.interestRate,
          design.interestRateType || "yearly",
          "months" // Always use months since we store in months
        )
      : [];

  // Calculate loan summary with null checks
  const loanSummary =
    paymentSchedule.length > 0
      ? {
          totalInterest: paymentSchedule.reduce(
            (sum, row) => sum + row.interest,
            0
          ),
          totalAmountPaid:
            design.price +
            paymentSchedule.reduce((sum, row) => sum + row.interest, 0),
          monthlyPayment: paymentSchedule[0]?.payment || 0,
        }
      : null;

  // Calculate display term for UI (convert months back to years if needed)
  const displayTerm =
    design.maxLoanTerm !== undefined && design.maxLoanTerm !== null
      ? design.loanTermType === "years"
        ? `${Math.round(design.maxLoanTerm / 12)} years`
        : `${design.maxLoanTerm} months`
      : "N/A";

  // Pagination logic for payment schedule
  const totalPages = Math.ceil(paymentSchedule.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPayments = paymentSchedule.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--orange)] hover:bg-orange-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Catalog
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">{design.name}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onEdit}
              className="text-sm cursor-pointer"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsDeleteDesignOpen(true)}
              className="text-sm text-red-600 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-6">
        <p className="text-sm text-gray-500 text-center">
          Design ID: {design.design_id}
        </p>

        {design.images.length > 0 ? (
          <div className="grid gap-4">
            <div className="relative">
              <img
                src={design.images[currentImageIndex]}
                alt={`${design.name} ${currentImageIndex + 1}`}
                className={`h-auto w-full max-h-96 object-contain rounded-lg ${
                  isAnimating
                    ? "opacity-0 transition-opacity duration-300"
                    : "opacity-100 transition-opacity duration-300"
                }`}
              />
              {design.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    &lt;
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:black/70"
                  >
                    &gt;
                  </button>
                </>
              )}
            </div>
            {design.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {design.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className={`flex-shrink-0 ${
                      index === currentImageIndex
                        ? "ring-2 ring-[var(--orange)]"
                        : ""
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${design.name} thumbnail ${index + 1}`}
                      className="h-16 w-16 object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">No images available</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 min-w-[120px]">
                Description:
              </Label>
              <p className="text-base">{capitalizeWords(design.description)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 min-w-[120px]">
                Category:
              </Label>
              <p className="text-base">{capitalizeWords(design.category)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 min-w-[120px]">
                Price:
              </Label>
              <p className="text-base font-semibold">
                {formatCurrency(design.price)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 min-w-[120px]">
                Number of Rooms:
              </Label>
              <p className="text-base">{design.number_of_rooms}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 min-w-[120px]">
                Area:
              </Label>
              <p className="text-base">
                {formatSquareMeters(design.square_meters)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 min-w-[120px]">
                Loan Offered:
              </Label>
              <p className="text-base">{design.isLoanOffer ? "Yes" : "No"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 min-w-[120px]">
                Created At:
              </Label>
              <p className="text-base">
                {design.createdAt
                  ? new Date(design.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 min-w-[120px]">
                Updated At:
              </Label>
              <p className="text-base">
                {design.updatedAt
                  ? new Date(design.updatedAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {design.isLoanOffer && (
          <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[var(--orange)]" />
              <h3 className="text-lg font-bold text-gray-800">
                Financing Options
              </h3>
            </div>
            <div className="p-4">
              {loanSummary ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 block mb-1">
                        Loan Amount
                      </Label>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(design.price)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 block mb-1">
                        Term
                      </Label>
                      <p className="text-xl font-semibold text-gray-900">
                        {displayTerm}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 block mb-1">
                        Interest Rate
                      </Label>
                      <p className="text-xl font-semibold text-gray-900">
                        {design.interestRate !== undefined &&
                        design.interestRate !== null
                          ? `${design.interestRate}%`
                          : "N/A"}{" "}
                        <span className="text-sm text-gray-500">
                          ({design.interestRateType || "yearly"})
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 block mb-1">
                        Monthly Payment
                      </Label>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(loanSummary.monthlyPayment)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 block mb-1">
                        Total Interest
                      </Label>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(loanSummary.totalInterest)}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                      <Label className="text-sm font-medium text-orange-700 block mb-1">
                        Total Cost
                      </Label>
                      <p className="text-2xl font-bold text-[var(--orange)]">
                        {formatCurrency(loanSummary.totalAmountPaid)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowLoanDetails(!showLoanDetails);
                        setCurrentPage(1); // Reset to first page when showing details
                      }}
                      className="text-[var(--orange)] border-[var(--orange)] hover:bg-orange-50"
                    >
                      {showLoanDetails
                        ? "Hide Payment Schedule"
                        : "Show Payment Schedule"}
                    </Button>

                    {showLoanDetails && (
                      <div className="mt-6 border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="font-semibold">
                                Month
                              </TableHead>
                              <TableHead className="font-semibold">
                                Payment
                              </TableHead>
                              <TableHead className="font-semibold">
                                Principal
                              </TableHead>
                              <TableHead className="font-semibold">
                                Interest
                              </TableHead>
                              <TableHead className="font-semibold">
                                Balance
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentPayments.map((row) => (
                              <TableRow key={row.month}>
                                <TableCell>{row.month}</TableCell>
                                <TableCell>
                                  {formatCurrency(row.payment)}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(row.principal)}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(row.interest)}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(row.balance)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
                            <div className="text-sm text-[var(--orange)]">
                              Showing {startIndex + 1}-
                              {Math.min(endIndex, paymentSchedule.length)} of{" "}
                              {paymentSchedule.length} payments
                            </div>
                            <div className="flex items-center gap-2 ">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronLeftIcon className="h-4 w-4" />
                              </Button>

                              {Array.from(
                                { length: Math.min(5, totalPages) },
                                (_, i) => {
                                  let pageNum;
                                  if (totalPages <= 5) {
                                    pageNum = i + 1;
                                  } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                  } else {
                                    pageNum = currentPage - 2 + i;
                                  }

                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={
                                        currentPage === pageNum
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() => handlePageClick(pageNum)}
                                      className="h-8 w-8 p-0 "
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                }
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0 "
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-[var(--orange)]">
                  <p className="text-gray-500">
                    {design.maxLoanTerm !== undefined &&
                    design.maxLoanTerm !== null &&
                    design.interestRate !== undefined &&
                    design.interestRate !== null
                      ? "Invalid loan configuration. Please check term or interest rate."
                      : "Loan details are not fully configured"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteDesignOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDesignOpen(false)}
        title="Delete Design"
        description="Are you sure you want to delete this design? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
