"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Design } from "@/types/design";
import { Home, Square, Heart, FileText } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PDFFormatter } from "@/components/admin/catalog/pdf/Formatter";
import { calculatePaymentSchedule, formatCurrency } from "@/lib/amortization";

interface CatalogCardProps {
  design: Design;
  onDesignClick: (design: Design) => void;
  onInquire: (design: Design) => void;
  formatPrice: (price: number) => string;
  formatSquareMeters?: (square_meters: number) => string;
  capitalizeFirstLetter?: (str: string) => string;
}

export function CatalogCard({
  design,
  onDesignClick,
  onInquire,
  formatPrice,
  formatSquareMeters = (sqm) => `${sqm} sqm`,
  capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1),
}: CatalogCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    onDesignClick(design);
  };

  const handleGetQuotation = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!design.isLoanOffer) {
      // If no loan offer, fall back to inquire
      onInquire(design);
      return;
    }

    try {
      // Calculate default loan values
      const downpaymentAmount =
        design.estimated_downpayment || design.price * 0.2;
      const selectedTerm = design.maxLoanTerm || 60; // Default to 5 years if not specified

      // Calculate payment schedule
      const loanCalculation = calculatePaymentSchedule(
        design.price,
        downpaymentAmount,
        selectedTerm,
        design.interestRate || 0,
        design.interestRateType || "yearly",
        "months"
      );

      // Use PDF formatter to generate and download PDF
      const { exportToPDF } = PDFFormatter({
        design,
        selectedTerm,
        loanSummary: {
          totalInterest: loanCalculation.totalInterest,
          totalAmountPaid: loanCalculation.totalPayment,
          monthlyPayment: loanCalculation.monthlyPayment,
          loanAmount: loanCalculation.loanAmount,
        },
        paymentSchedule: loanCalculation.schedule,
        downpaymentAmount,
      });

      await exportToPDF();
    } catch (error) {
      console.error("Error generating quotation:", error);
      // Fall back to inquire if PDF generation fails
      onInquire(design);
    }
  };

  return (
    <div className="space-y-3">
      {/* Image Section - Separate Card */}
      <div
        className="bg-white rounded-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer relative group"
        onClick={handleCardClick}
      >
        <div className="relative">
          {design.images.length > 0 ? (
            <div className="relative aspect-video bg-gray-100">
              <Image
                src={design.images[0]}
                alt={design.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}

          {/* Favorite Button - Only show on hover */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-7 w-7 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={(e) => {
              e.stopPropagation();
              // Add favorite functionality here
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info Section - Separate from image */}
      <div className="rounded-none">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm text-base truncate">
              {formatPrice(design.price)}
            </h3>
            <p className="text-gray-600 text-sm font-medium mb-2">
              {capitalizeFirstLetter(design.name)}
            </p>

            {/* Room, Square Meters, and Loan Available Info */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {/* Loan Available Text - Only show when loan is available */}
              {design.isLoanOffer && (
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <span>Loan Available</span>
                </div>
              )}
            </div>
          </div>

          {/* Get Quotation Button - Shows PDF icon when loan is available */}
          {design.isLoanOffer ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 text-xs h-8 px-3 border-green-600 text-green-600 hover:bg-green-600 hover:text-white flex items-center gap-1"
              onClick={handleGetQuotation}
            >
              <FileText className="h-3 w-3" />
              Get Quotation
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 text-xs h-8 px-3 border-[var(--orange)] text-[var(--orange)] hover:bg-[var(--orange)] hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onInquire(design);
              }}
            >
              Inquire
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
