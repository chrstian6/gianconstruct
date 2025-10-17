"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calculator,
  User,
  Home,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Building,
  Receipt,
} from "lucide-react";
import { PaymentData } from "./transaction-page";

interface PaymentFormProps {
  onSubmit: (data: PaymentData) => void;
}

export function PaymentForm({ onSubmit }: PaymentFormProps) {
  const [activeSection, setActiveSection] = useState<
    "client" | "design" | "payment"
  >("client");

  // Form state
  const [clientInfo, setClientInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [designInfo, setDesignInfo] = useState({
    name: "",
    price: "",
    squareMeters: "",
    isLoanOffer: false,
  });

  const [loanDetails, setLoanDetails] = useState({
    interestRate: "5",
    loanTerm: "15",
    downPayment: "",
    monthlyPayment: "",
  });

  const [paymentInfo, setPaymentInfo] = useState({
    paymentType: "cash",
    paymentMethod: "cash",
    amount: "",
    dueDate: "",
    notes: "",
  });

  // Format currency input
  const formatCurrency = (value: string): string => {
    const numeric = value.replace(/[^0-9]/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle client info changes
  const handleClientInfoChange = (field: string, value: string) => {
    setClientInfo((prev) => ({ ...prev, [field]: value }));
  };

  // Handle design info changes
  const handleDesignInfoChange = (field: string, value: string | boolean) => {
    setDesignInfo((prev) => ({ ...prev, [field]: value }));

    // Auto-calculate downpayment if price changes and loan is enabled
    if (
      field === "price" &&
      typeof value === "string" &&
      designInfo.isLoanOffer
    ) {
      const numericPrice = parseFloat(value.replace(/,/g, "")) || 0;
      const calculatedDownpayment = Math.round(numericPrice * 0.2);
      setLoanDetails((prev) => ({
        ...prev,
        downPayment: calculatedDownpayment.toLocaleString(),
      }));
    }
  };

  // Handle loan details changes
  const handleLoanDetailsChange = (field: string, value: string) => {
    setLoanDetails((prev) => ({ ...prev, [field]: value }));

    // Calculate monthly payment when relevant fields change
    if (
      field === "interestRate" ||
      field === "loanTerm" ||
      field === "downPayment"
    ) {
      calculateMonthlyPayment();
    }
  };

  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    const designPrice = parseFloat(designInfo.price.replace(/,/g, "")) || 0;
    const downPayment =
      parseFloat(loanDetails.downPayment.replace(/,/g, "")) || 0;
    const interestRate = parseFloat(loanDetails.interestRate) || 5;
    const loanTerm = parseFloat(loanDetails.loanTerm) || 15;

    if (designPrice > 0 && downPayment > 0 && loanTerm > 0) {
      const loanAmount = designPrice - downPayment;
      const monthlyRate = interestRate / 100 / 12;
      const numberOfPayments = loanTerm * 12;

      if (monthlyRate === 0) {
        const monthlyPayment = loanAmount / numberOfPayments;
        setLoanDetails((prev) => ({
          ...prev,
          monthlyPayment: Math.round(monthlyPayment).toLocaleString(),
        }));
      } else {
        const monthlyPayment =
          (loanAmount *
            (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        setLoanDetails((prev) => ({
          ...prev,
          monthlyPayment: Math.round(monthlyPayment).toLocaleString(),
        }));
      }
    }
  };

  // Handle payment info changes
  const handlePaymentInfoChange = (field: string, value: string) => {
    setPaymentInfo((prev) => ({ ...prev, [field]: value }));

    // Auto-set amount based on payment type
    if (field === "paymentType") {
      const designPrice = parseFloat(designInfo.price.replace(/,/g, "")) || 0;
      const downPayment =
        parseFloat(loanDetails.downPayment.replace(/,/g, "")) || 0;
      const monthlyPayment =
        parseFloat(loanDetails.monthlyPayment.replace(/,/g, "")) || 0;

      switch (value) {
        case "downpayment":
          setPaymentInfo((prev) => ({
            ...prev,
            amount: downPayment.toLocaleString(),
          }));
          break;
        case "monthly":
          setPaymentInfo((prev) => ({
            ...prev,
            amount: monthlyPayment.toLocaleString(),
          }));
          break;
        case "full":
          setPaymentInfo((prev) => ({
            ...prev,
            amount: designPrice.toLocaleString(),
          }));
          break;
        case "cash":
          setPaymentInfo((prev) => ({
            ...prev,
            amount: designPrice.toLocaleString(),
          }));
          break;
      }
    }
  };

  // Check if client section is complete
  const isClientSectionComplete = () => {
    return (
      clientInfo.name &&
      clientInfo.email &&
      clientInfo.phone &&
      clientInfo.address
    );
  };

  // Check if design section is complete
  const isDesignSectionComplete = () => {
    return designInfo.name && designInfo.price && designInfo.squareMeters;
  };

  // Check if payment section is complete
  const isPaymentSectionComplete = () => {
    return paymentInfo.amount && paymentInfo.paymentMethod;
  };

  const handleNext = () => {
    if (activeSection === "client" && isClientSectionComplete()) {
      setActiveSection("design");
    } else if (activeSection === "design" && isDesignSectionComplete()) {
      setActiveSection("payment");
    }
  };

  const handleBack = () => {
    if (activeSection === "design") {
      setActiveSection("client");
    } else if (activeSection === "payment") {
      setActiveSection("design");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const paymentData: PaymentData = {
      id: `TRX-${Date.now()}`,
      clientName: clientInfo.name,
      clientEmail: clientInfo.email,
      clientPhone: clientInfo.phone,
      clientAddress: clientInfo.address,
      paymentType: paymentInfo.paymentType as any,
      paymentMethod: paymentInfo.paymentMethod as any,
      amount: parseFloat(paymentInfo.amount.replace(/,/g, "")) || 0,
      designDetails: {
        name: designInfo.name,
        price: parseFloat(designInfo.price.replace(/,/g, "")) || 0,
        squareMeters:
          parseFloat(designInfo.squareMeters.replace(/,/g, "")) || 0,
        isLoanOffer: designInfo.isLoanOffer,
        loanDetails: designInfo.isLoanOffer
          ? {
              interestRate: parseFloat(loanDetails.interestRate) || 0,
              loanTerm: parseFloat(loanDetails.loanTerm) || 0,
              downPayment:
                parseFloat(loanDetails.downPayment.replace(/,/g, "")) || 0,
              monthlyPayment:
                parseFloat(loanDetails.monthlyPayment.replace(/,/g, "")) || 0,
            }
          : undefined,
      },
      transactionDate: new Date().toISOString(),
      dueDate: paymentInfo.dueDate,
      referenceNumber: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      notes: paymentInfo.notes,
    };

    onSubmit(paymentData);
  };

  const SectionNavigation = () => (
    <div className="flex justify-center border-b mb-6">
      <div className="flex gap-8">
        <button
          type="button"
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeSection === "client"
              ? "border-blue-500 font-semibold text-gray-900"
              : "border-transparent text-gray-500"
          }`}
        >
          Client Info
        </button>
        <button
          type="button"
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeSection === "design"
              ? "border-blue-500 font-semibold text-gray-900"
              : "border-transparent text-gray-500"
          } ${!isClientSectionComplete() ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Design Info
        </button>
        <button
          type="button"
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeSection === "payment"
              ? "border-blue-500 font-semibold text-gray-900"
              : "border-transparent text-gray-500"
          } ${!isDesignSectionComplete() ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Payment Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[600px]">
      <SectionNavigation />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Form Content */}
        <div className="flex-1">
          {/* Client Information Section */}
          {activeSection === "client" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
                <CardDescription>
                  Enter the client's contact and personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="clientName" className="text-sm font-medium">
                      Client Name *
                    </Label>
                    <Input
                      id="clientName"
                      value={clientInfo.name}
                      onChange={(e) =>
                        handleClientInfoChange("name", e.target.value)
                      }
                      placeholder="Enter client full name"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="clientEmail"
                      className="text-sm font-medium"
                    >
                      Email Address *
                    </Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientInfo.email}
                      onChange={(e) =>
                        handleClientInfoChange("email", e.target.value)
                      }
                      placeholder="client@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="clientPhone"
                      className="text-sm font-medium"
                    >
                      Phone Number *
                    </Label>
                    <Input
                      id="clientPhone"
                      value={clientInfo.phone}
                      onChange={(e) =>
                        handleClientInfoChange("phone", e.target.value)
                      }
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="paymentMethod"
                      className="text-sm font-medium"
                    >
                      Payment Method *
                    </Label>
                    <Select
                      value={paymentInfo.paymentMethod}
                      onValueChange={(value) =>
                        handlePaymentInfoChange("paymentMethod", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="clientAddress"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Client Address *
                  </Label>
                  <Textarea
                    id="clientAddress"
                    value={clientInfo.address}
                    onChange={(e) =>
                      handleClientInfoChange("address", e.target.value)
                    }
                    placeholder="Enter complete client address"
                    className="min-h-[100px]"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Design Information Section */}
          {activeSection === "design" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5" />
                  Design Information
                </CardTitle>
                <CardDescription>
                  Enter the design details and financing options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="designName" className="text-sm font-medium">
                      Design Name *
                    </Label>
                    <Input
                      id="designName"
                      value={designInfo.name}
                      onChange={(e) =>
                        handleDesignInfoChange("name", e.target.value)
                      }
                      placeholder="Enter design name"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="squareMeters"
                      className="text-sm font-medium"
                    >
                      Square Meters (sqm) *
                    </Label>
                    <Input
                      id="squareMeters"
                      value={designInfo.squareMeters}
                      onChange={(e) =>
                        handleDesignInfoChange("squareMeters", e.target.value)
                      }
                      placeholder="Enter total area"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="designPrice"
                      className="text-sm font-medium"
                    >
                      Design Price (₱) *
                    </Label>
                    <Input
                      id="designPrice"
                      type="text"
                      value={designInfo.price ? `₱${designInfo.price}` : ""}
                      onChange={(e) =>
                        handleDesignInfoChange(
                          "price",
                          formatCurrency(e.target.value.replace("₱", ""))
                        )
                      }
                      placeholder="Enter design price"
                      required
                    />
                  </div>

                  <div className="space-y-3 flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label
                        htmlFor="isLoanOffer"
                        className="text-sm font-medium"
                      >
                        Offer Financing
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Enable loan options for this design
                      </p>
                    </div>
                    <Switch
                      id="isLoanOffer"
                      checked={designInfo.isLoanOffer}
                      onCheckedChange={(checked) =>
                        handleDesignInfoChange("isLoanOffer", checked)
                      }
                    />
                  </div>
                </div>

                {designInfo.isLoanOffer && (
                  <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
                    <h4 className="text-sm font-medium">Loan Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Interest Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={loanDetails.interestRate}
                          onChange={(e) =>
                            handleLoanDetailsChange(
                              "interestRate",
                              e.target.value
                            )
                          }
                          placeholder="5.0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Loan Term (years)</Label>
                        <Input
                          type="number"
                          value={loanDetails.loanTerm}
                          onChange={(e) =>
                            handleLoanDetailsChange("loanTerm", e.target.value)
                          }
                          placeholder="15"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Down Payment (₱)</Label>
                        <Input
                          type="text"
                          value={
                            loanDetails.downPayment
                              ? `₱${loanDetails.downPayment}`
                              : ""
                          }
                          onChange={(e) =>
                            handleLoanDetailsChange(
                              "downPayment",
                              formatCurrency(e.target.value.replace("₱", ""))
                            )
                          }
                          placeholder="Enter amount"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Monthly Payment (₱)</Label>
                        <Input
                          type="text"
                          value={
                            loanDetails.monthlyPayment
                              ? `₱${loanDetails.monthlyPayment}`
                              : ""
                          }
                          readOnly
                          className="bg-gray-100"
                          placeholder="Auto-calculated"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Details Section */}
          {activeSection === "payment" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Finalize the payment transaction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="paymentType"
                      className="text-sm font-medium"
                    >
                      Payment Type *
                    </Label>
                    <Select
                      value={paymentInfo.paymentType}
                      onValueChange={(value) =>
                        handlePaymentInfoChange("paymentType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="downpayment">
                          Down Payment
                        </SelectItem>
                        <SelectItem value="monthly">Monthly Payment</SelectItem>
                        <SelectItem value="cash">Cash Payment</SelectItem>
                        <SelectItem value="full">Full Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="amount"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Calculator className="h-4 w-4" />
                      Amount (₱) *
                    </Label>
                    <Input
                      id="amount"
                      type="text"
                      value={paymentInfo.amount ? `₱${paymentInfo.amount}` : ""}
                      onChange={(e) =>
                        handlePaymentInfoChange(
                          "amount",
                          formatCurrency(e.target.value.replace("₱", ""))
                        )
                      }
                      placeholder="Enter payment amount"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="dueDate" className="text-sm font-medium">
                      Due Date (Optional)
                    </Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={paymentInfo.dueDate}
                      onChange={(e) =>
                        handlePaymentInfoChange("dueDate", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="paymentMethodFinal"
                      className="text-sm font-medium"
                    >
                      Payment Method *
                    </Label>
                    <Select
                      value={paymentInfo.paymentMethod}
                      onValueChange={(value) =>
                        handlePaymentInfoChange("paymentMethod", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={paymentInfo.notes}
                    onChange={(e) =>
                      handlePaymentInfoChange("notes", e.target.value)
                    }
                    placeholder="Additional notes about this transaction..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t bg-white sticky bottom-0 pb-6">
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={activeSection === "client"}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              Step{" "}
              {activeSection === "client"
                ? 1
                : activeSection === "design"
                  ? 2
                  : 3}{" "}
              of 3
            </div>

            {activeSection !== "payment" ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  (activeSection === "client" && !isClientSectionComplete()) ||
                  (activeSection === "design" && !isDesignSectionComplete())
                }
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!isPaymentSectionComplete()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Receipt className="h-4 w-4" />
                Process Payment
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
