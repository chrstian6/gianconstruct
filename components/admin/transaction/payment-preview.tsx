"use client";

import { PaymentData } from "./transaction-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, Receipt, FileText } from "lucide-react";

interface PaymentPreviewProps {
  paymentData: PaymentData | null;
  onPrint: () => void;
  onDownload: () => void;
  isGenerating: boolean;
}

export function PaymentPreview({
  paymentData,
  onPrint,
  onDownload,
  isGenerating,
}: PaymentPreviewProps) {
  if (!paymentData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Complete the payment form to see preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case "downpayment":
        return "bg-blue-100 text-blue-800";
      case "monthly":
        return "bg-green-100 text-green-800";
      case "cash":
        return "bg-purple-100 text-purple-800";
      case "full":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash":
        return "Cash";
      case "card":
        return "Credit/Debit Card";
      case "bank_transfer":
        return "Bank Transfer";
      case "check":
        return "Check";
      default:
        return method;
    }
  };

  return (
    <Card className="print:shadow-none print:border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Payment Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="flex gap-2 print:hidden">
          <Button
            onClick={onPrint}
            disabled={isGenerating}
            className="flex-1"
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Print Receipt"}
          </Button>
          <Button
            onClick={onDownload}
            disabled={isGenerating}
            className="flex-1"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Download PDF"}
          </Button>
        </div>

        {/* Receipt Content */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 print:border-0">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              OFFICIAL RECEIPT
            </h2>
            <p className="text-gray-600">Your Company Name Here</p>
            <p className="text-sm text-gray-500">
              123 Business Street, City, Country
            </p>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Receipt No:</p>
              <p className="font-semibold">{paymentData.referenceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date:</p>
              <p className="font-semibold">
                {new Date(paymentData.transactionDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Client Information</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-600">Name:</span>{" "}
                {paymentData.clientName}
              </p>
              <p>
                <span className="text-gray-600">Email:</span>{" "}
                {paymentData.clientEmail}
              </p>
              <p>
                <span className="text-gray-600">Phone:</span>{" "}
                {paymentData.clientPhone}
              </p>
              <p>
                <span className="text-gray-600">Address:</span>{" "}
                {paymentData.clientAddress}
              </p>
            </div>
          </div>

          {/* Design Information */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Design Details</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-600">Design:</span>{" "}
                {paymentData.designDetails.name}
              </p>
              <p>
                <span className="text-gray-600">Area:</span>{" "}
                {paymentData.designDetails.squareMeters} sqm
              </p>
              <p>
                <span className="text-gray-600">Total Price:</span> ₱
                {paymentData.designDetails.price.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Payment Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Type:</span>
                <Badge className={getPaymentTypeColor(paymentData.paymentType)}>
                  {paymentData.paymentType.charAt(0).toUpperCase() +
                    paymentData.paymentType.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span>{getPaymentMethodText(paymentData.paymentMethod)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-bold text-lg">
                  ₱{paymentData.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Loan Details */}
          {paymentData.designDetails.isLoanOffer &&
            paymentData.designDetails.loanDetails && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Loan Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Interest Rate:</span>
                    <p>{paymentData.designDetails.loanDetails.interestRate}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Loan Term:</span>
                    <p>
                      {paymentData.designDetails.loanDetails.loanTerm} years
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Down Payment:</span>
                    <p>
                      ₱
                      {paymentData.designDetails.loanDetails.downPayment.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Monthly Payment:</span>
                    <p>
                      ₱
                      {paymentData.designDetails.loanDetails.monthlyPayment.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Due Date */}
          {paymentData.dueDate && (
            <div className="mb-6">
              <p className="text-sm">
                <span className="text-gray-600">Next Due Date:</span>{" "}
                {new Date(paymentData.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Notes */}
          {paymentData.notes && (
            <div className="mb-6">
              <h3 className="font-semibold mb-1">Notes</h3>
              <p className="text-sm text-gray-600">{paymentData.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 mt-6 text-center">
            <p className="text-sm text-gray-500">
              Thank you for your business!
            </p>
            <p className="text-xs text-gray-400 mt-2">
              This is an official receipt. Please keep it for your records.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
