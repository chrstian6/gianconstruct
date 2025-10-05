import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { Design } from "@/types/design";
import { calculatePaymentSchedule, formatCurrency } from "@/lib/amortization";
import { Slider } from "@/components/ui/slider";
import { ExcelFormatter } from "@/components/admin/catalog/csv/Formatter";
import { PDFFormatter } from "@/components/admin/catalog/pdf/Formatter";

interface QuotationCardProps {
  design: Design;
}

export default function QuotationCard({ design }: QuotationCardProps) {
  const [selectedTerm, setSelectedTerm] = useState<number>(0);
  const [downpaymentAmount, setDownpaymentAmount] = useState<number>(0);

  // Initialize selected term and downpayment based on design
  useEffect(() => {
    if (design.maxLoanTerm && design.maxLoanTerm > 0) {
      setSelectedTerm(design.maxLoanTerm);
    }

    // Initialize downpayment with design's estimated_downpayment or calculate 20% default
    if (design.estimated_downpayment && design.estimated_downpayment > 0) {
      setDownpaymentAmount(design.estimated_downpayment);
    } else if (design.price > 0) {
      // Default to 20% if no downpayment is specified
      setDownpaymentAmount(design.price * 0.2);
    }
  }, [design.maxLoanTerm, design.estimated_downpayment, design.price]);

  // Calculate payment schedule with downpayment integration
  const loanCalculation =
    design.isLoanOffer &&
    selectedTerm > 0 &&
    design.interestRate !== undefined &&
    design.interestRate !== null &&
    design.interestRate >= 0
      ? calculatePaymentSchedule(
          design.price,
          downpaymentAmount,
          selectedTerm,
          design.interestRate,
          design.interestRateType || "yearly",
          "months"
        )
      : null;

  // Calculate display term for UI (convert months back to years if needed)
  const displayTerm =
    selectedTerm > 0
      ? design.loanTermType === "years"
        ? `${Math.round(selectedTerm / 12)} years`
        : `${selectedTerm} months`
      : "N/A";

  // Calculate max term for slider
  const maxTerm = design.maxLoanTerm || 0;
  const minTerm = design.loanTermType === "years" ? 12 : 1;

  // Calculate downpayment percentage
  const downpaymentPercentage =
    design.price > 0 ? (downpaymentAmount / design.price) * 100 : 0;

  const handleTermChange = (value: number[]) => {
    setSelectedTerm(value[0]);
  };

  const handleDownpaymentChange = (value: number[]) => {
    setDownpaymentAmount(value[0]);
  };

  // Use the Excel formatter
  const { exportToExcel } = ExcelFormatter({
    design,
    selectedTerm,
    loanSummary: loanCalculation
      ? {
          totalInterest: loanCalculation.totalInterest,
          totalAmountPaid: loanCalculation.totalPayment,
          monthlyPayment: loanCalculation.monthlyPayment,
          loanAmount: loanCalculation.loanAmount,
        }
      : null,
    paymentSchedule: loanCalculation?.schedule || [],
    downpaymentAmount,
  });

  // Use the PDF formatter
  const { exportToPDF } = PDFFormatter({
    design,
    selectedTerm,
    loanSummary: loanCalculation
      ? {
          totalInterest: loanCalculation.totalInterest,
          totalAmountPaid: loanCalculation.totalPayment,
          monthlyPayment: loanCalculation.monthlyPayment,
          loanAmount: loanCalculation.loanAmount,
        }
      : null,
    paymentSchedule: loanCalculation?.schedule || [],
    downpaymentAmount,
  });

  return (
    <div className="px-8 pb-8 space-y-8">
      {/* Header Section */}
      <div className="flex">
        <div className="w-full items-start text-start justify-start gap-3">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Loan Quotation
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Financing options for {design.name}
            </p>
          </div>
        </div>
      </div>

      {/* Financing Options Section */}
      {design.isLoanOffer && (
        <div className="mt-6 space-y-8">
          {loanCalculation ? (
            <>
              {/* Downpayment Selection Slider */}
              <Card className="p-6 border border-gray-200 shadow-none">
                <CardContent className="p-0 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 font-medium">
                      Select Downpayment
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(downpaymentAmount)} (
                      {downpaymentPercentage.toFixed(1)}%)
                    </p>
                  </div>
                  <Slider
                    value={[downpaymentAmount]}
                    onValueChange={handleDownpaymentChange}
                    max={design.price}
                    min={0}
                    step={10000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>₱0</span>
                    <span>{formatCurrency(design.price)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Term Selection Slider */}
              {maxTerm > 0 && (
                <Card className="p-6 border border-gray-200 shadow-none">
                  <CardContent className="p-0 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 font-medium">
                        Select Loan Term
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {displayTerm}
                      </p>
                    </div>
                    <Slider
                      value={[selectedTerm]}
                      onValueChange={handleTermChange}
                      max={maxTerm}
                      min={minTerm}
                      step={design.loanTermType === "years" ? 12 : 1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {design.loanTermType === "years" ? "1 year" : "1 month"}
                      </span>
                      <span>
                        {design.loanTermType === "years"
                          ? `${Math.round(maxTerm / 12)} years`
                          : `${maxTerm} months`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Card-based Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Total Price Card */}
                <Card className="p-2 min-h-[140px] flex items-center justify-center rounded-sm shadow-none">
                  <CardContent className="p-0 text-center w-full">
                    <p className="text-xs text-gray-600 mb-4 font-medium">
                      Total Price
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(design.price)}
                    </p>
                  </CardContent>
                </Card>

                {/* Downpayment Card */}
                <Card className="p-6 min-h-[140px] flex items-center justify-center rounded-sm border border-gray-200 shadow-none">
                  <CardContent className="p-0 text-center w-full">
                    <p className="text-sm text-gray-600 mb-4 font-medium">
                      Downpayment
                    </p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {formatCurrency(downpaymentAmount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      ({downpaymentPercentage.toFixed(1)}%)
                    </p>
                  </CardContent>
                </Card>

                {/* Loan Amount Card */}
                <Card className="p-6 min-h-[140px] flex items-center justify-center rounded-sm shadow-none border border-gray-200">
                  <CardContent className="p-0 text-center w-full">
                    <p className="text-xs text-gray-600 mb-4 font-medium">
                      Loan Amount
                    </p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {formatCurrency(loanCalculation.loanAmount)}
                    </p>
                  </CardContent>
                </Card>

                {/* Term Card */}
                <Card className="p-6 min-h-[140px] flex items-center justify-center rounded-sm border border-gray-200 shadow-none">
                  <CardContent className="p-0 text-center w-full">
                    <p className="text-sm text-gray-600 mb-4 font-medium">
                      Term
                    </p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {displayTerm}
                    </p>
                  </CardContent>
                </Card>

                {/* Interest Rate Card */}
                <Card className="p-6 min-h-[140px] flex items-center justify-center rounded-sm shadow-none border border-gray-200">
                  <CardContent className="p-0 text-center w-full">
                    <p className="text-xs text-gray-600 mb-4 font-medium">
                      Interest Rate
                    </p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {design.interestRate !== undefined &&
                      design.interestRate !== null
                        ? `${design.interestRate.toFixed(2)}%`
                        : "N/A"}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      ({design.interestRateType || "yearly"})
                    </p>
                  </CardContent>
                </Card>

                {/* Monthly Payment Card */}
                <Card className="p-6 min-h-[140px] flex items-center justify-center rounded-lg border border-gray-200 shadow-none">
                  <CardContent className="p-0 text-center w-full">
                    <p className="text-xs text-gray-600 mb-4 font-medium">
                      Monthly Payment
                    </p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {formatCurrency(loanCalculation.monthlyPayment)}
                    </p>
                  </CardContent>
                </Card>

                {/* Total Interest Card */}
                <Card className="p-2 min-h-[140px] flex items-center justify-center rounded-sm shadow-none border border-gray-200">
                  <CardContent className="p-0 text-center w-full">
                    <p className="text-xs text-gray-600 mb-4 font-medium">
                      Total Interest
                    </p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {formatCurrency(loanCalculation.totalInterest)}
                    </p>
                  </CardContent>
                </Card>

                {/* Total Payment Card */}
                <Card className="p-3 min-h-[140px] flex items-center justify-center rounded-sm shadow-none">
                  <CardContent className="p-0 text-center w-full">
                    <p className="text-xs text-[var(--orange)] mb-4 font-medium">
                      Total Cost
                    </p>
                    <p className="text-xs font-bold text-[var(--orange)] leading-tight">
                      {formatCurrency(
                        loanCalculation.totalPayment + downpaymentAmount
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      (Loan + Downpayment)
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Export Buttons Section */}
              <div className="mt-8 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={exportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-8 py-3 h-auto flex items-center gap-3 flex-1 justify-center"
                  >
                    <Download className="h-5 w-5" />
                    Export to Excel
                  </Button>

                  <Button
                    onClick={exportToPDF}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium text-sm px-8 py-3 h-auto flex items-center gap-3 flex-1 justify-center"
                  >
                    <FileText className="h-5 w-5" />
                    Export to PDF
                  </Button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    • Professional quotation with company header and loan
                    details
                  </p>
                  <p>
                    • Complete payment schedule with{" "}
                    {loanCalculation.schedule.length} payments
                  </p>
                  <p>• Excel: For data analysis and calculations</p>
                  <p>• PDF: For printing and professional presentation</p>
                </div>
              </div>

              {/* Quick Summary */}
              <Card className="mt-6 border border-gray-200 shadow-none">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Payment Schedule Summary
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Payments</p>
                      <p className="font-semibold">
                        {loanCalculation.schedule.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">First Payment</p>
                      <p className="font-semibold">
                        {formatCurrency(loanCalculation.monthlyPayment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Last Payment</p>
                      <p className="font-semibold">
                        {formatCurrency(
                          loanCalculation.schedule[
                            loanCalculation.schedule.length - 1
                          ]?.payment || 0
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Interest Paid</p>
                      <p className="font-semibold">
                        {formatCurrency(loanCalculation.totalInterest)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center border border-gray-200 shadow-sm">
              <CardContent className="p-0">
                <p className="text-gray-500 text-sm">
                  {design.maxLoanTerm !== undefined &&
                  design.maxLoanTerm !== null &&
                  design.interestRate !== undefined &&
                  design.interestRate !== null
                    ? "Invalid loan configuration. Please check term or interest rate."
                    : "Loan details are not fully configured"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Not Available for Loan Message */}
      {!design.isLoanOffer && (
        <Card className="p-8 text-center border border-gray-200 shadow-sm">
          <CardContent className="p-0">
            <p className="text-gray-500 text-sm">
              This design is not available for financing options.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
