"use client";

import { Design } from "@/types/design";
import { Button } from "@/components/ui/button";
import {
  Home,
  Square,
  Heart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { calculatePaymentSchedule, formatCurrency } from "@/lib/amortization";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PublicDesignDetailsProps {
  design: Design;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInquire: (design: Design) => void;
}

export function PublicDesignDetails({
  design,
  open,
  onOpenChange,
  onInquire,
}: PublicDesignDetailsProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const formatPrice = (price: number): string => {
    return `₱${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === design.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? design.images.length - 1 : prev - 1
    );
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  // Format loan term for display, matching admin side behavior
  const formatLoanTerm = (): string => {
    if (design.maxLoanTerm == null || design.loanTermType == null) return "N/A";
    if (design.loanTermType === "years") {
      const years = Math.round(design.maxLoanTerm / 12);
      return `${years} ${years === 1 ? "year" : "years"}`;
    }
    return `${design.maxLoanTerm} ${design.maxLoanTerm === 1 ? "month" : "months"}`;
  };

  // Calculate payment schedule if loan details are available
  const paymentSchedule =
    design.isLoanOffer &&
    design.maxLoanTerm &&
    design.interestRate &&
    design.interestRateType &&
    design.loanTermType
      ? calculatePaymentSchedule(
          design.price,
          design.maxLoanTerm,
          design.interestRate,
          design.interestRateType,
          design.loanTermType
        )
      : [];

  // Calculate summary of the loan
  const loanSummary = paymentSchedule.length
    ? {
        totalPayments: paymentSchedule.reduce(
          (sum, payment) => sum + payment.payment,
          0
        ),
        totalInterest: paymentSchedule.reduce(
          (sum, payment) => sum + payment.interest,
          0
        ),
        monthlyPayment: paymentSchedule[0]?.payment || 0,
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-accent font-bold">
            Design Specifications
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Selected Image */}
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
              {design.images[selectedImageIndex] && (
                <img
                  src={design.images[selectedImageIndex]}
                  alt={`${design.name} - ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Navigation Arrows */}
              {design.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Favorite Button */}
              <button
                onClick={toggleFavorite}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all"
              >
                <Heart
                  className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-700"}`}
                />
              </button>

              {/* Image Counter */}
              {design.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {design.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {design.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {design.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === index ? "border-[var(--orange)]" : "border-transparent"}`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Design Details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{design.name}</h3>
              <p className="text-gray-600">{design.description}</p>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger
                  value="loan"
                  disabled={!design.isLoanOffer}
                  className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
                >
                  Loan Info
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-[var(--orange)]" />
                    <div>
                      <p className="text-sm text-gray-500">Rooms</p>
                      <p className="font-medium">{design.number_of_rooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-[var(--orange)]" />
                    <div>
                      <p className="text-sm text-gray-500">Area</p>
                      <p className="font-medium">{design.square_meters} sqm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 text-[var(--orange)]">₱</span>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">{formatPrice(design.price)}</p>
                    </div>
                  </div>
                  {design.isLoanOffer && (
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 text-green-600">✓</span>
                      <div>
                        <p className="text-sm text-gray-500">Loan Available</p>
                        <p className="font-medium text-xs">
                          {formatLoanTerm()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="loan">
                {design.isLoanOffer ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">
                        Loan Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Loan Amount</p>
                          <p className="font-medium">
                            {formatPrice(design.price)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Interest Rate</p>
                          <p className="font-medium">
                            {design.interestRate}%{" "}
                            {design.interestRateType === "yearly"
                              ? "per year"
                              : "per month"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Loan Term</p>
                          <p className="font-medium">{formatLoanTerm()}</p>
                        </div>
                        {loanSummary && (
                          <div>
                            <p className="text-sm text-gray-600">
                              Monthly Payment
                            </p>
                            <p className="font-medium">
                              {formatCurrency(loanSummary.monthlyPayment)}
                            </p>
                          </div>
                        )}
                        {loanSummary && (
                          <>
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Interest
                              </p>
                              <p className="font-medium">
                                {formatCurrency(loanSummary.totalInterest)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Payments
                              </p>
                              <p className="font-medium">
                                {formatCurrency(loanSummary.totalPayments)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {paymentSchedule.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">
                          Amortization Schedule (First 12 Months)
                        </h4>
                        <div className="max-h-60 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Principal</TableHead>
                                <TableHead>Interest</TableHead>
                                <TableHead>Balance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paymentSchedule.slice(0, 12).map((payment) => (
                                <TableRow key={payment.month}>
                                  <TableCell>{payment.month}</TableCell>
                                  <TableCell>
                                    {formatCurrency(payment.payment)}
                                  </TableCell>
                                  <TableCell>
                                    {formatCurrency(payment.principal)}
                                  </TableCell>
                                  <TableCell>
                                    {formatCurrency(payment.interest)}
                                  </TableCell>
                                  <TableCell>
                                    {formatCurrency(payment.balance)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {paymentSchedule.length > 12 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Showing first 12 months of {paymentSchedule.length}{" "}
                            payments
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No loan information available for this design
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="pt-4 border-t">
              <Button
                onClick={() => onInquire(design)}
                className="w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90"
              >
                Inquire About This Design{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
