"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Receipt, Download, Printer } from "lucide-react";
import { PaymentForm } from "@/components/admin/transaction/payment-form";
import { PaymentPreview } from "@/components/admin/transaction/payment-preview";
import { POS } from "@/components/admin/transaction/pos";
import { toast } from "sonner";
import { PaymentData as POSPaymentData } from "@/types/payment";

export interface PaymentData {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  paymentType: "downpayment" | "monthly" | "cash" | "full";
  paymentMethod: "cash" | "card" | "bank_transfer" | "check";
  amount: number;
  designDetails: {
    name: string;
    price: number;
    squareMeters: number;
    isLoanOffer: boolean;
    loanDetails?: {
      interestRate: number;
      loanTerm: number;
      downPayment: number;
      monthlyPayment: number;
    };
  };
  transactionDate: string;
  dueDate?: string;
  referenceNumber: string;
  notes?: string;
}

export function TransactionPage() {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("PoS");

  const handlePaymentSubmit = (data: PaymentData) => {
    const newPaymentData = {
      ...data,
      id: `TRX-${Date.now()}`,
      referenceNumber: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      transactionDate: new Date().toISOString(),
    };

    setPaymentData(newPaymentData);
    toast.success("Payment processed successfully!");
  };

  const handlePOSPayment = (data: POSPaymentData) => {
    // Convert POS payment data to the existing PaymentData format
    const convertedPaymentData: PaymentData = {
      id: data.id,
      clientName: `${data.userInfo.firstName} ${data.userInfo.lastName}`,
      clientEmail: data.userInfo.email,
      clientPhone: data.userInfo.contactNo,
      clientAddress: data.userInfo.address,
      paymentType: data.paymentType,
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      designDetails: {
        name: data.designDetails.name,
        price: data.designDetails.price,
        squareMeters: data.designDetails.squareMeters,
        isLoanOffer: data.designDetails.isLoanOffer,
        loanDetails: data.designDetails.loanDetails,
      },
      transactionDate: data.transactionDate,
      dueDate: data.dueDate,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
    };

    setPaymentData(convertedPaymentData);
    toast.success("POS Payment processed successfully!");
  };

  const handlePrintReceipt = () => {
    setIsGenerating(true);
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
      toast.success("Receipt printed successfully!");
    }, 1000);
  };

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      toast.success("PDF downloaded successfully!");
      setIsGenerating(false);
    }, 1000);
  };

  const tabs = [
    "Overview",
    "PoS",
    "Billing",
    "Loan Payments",
    "Invoice",
    "Transaction History",
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "PoS":
        return <POS onPaymentProcess={handlePOSPayment} />;
      case "Overview":
      case "Billing":
      case "Loan Payments":
      case "Invoice":
      case "Transaction History":
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Payment Form Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Receipt className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900 font-geist">
                    Quick Transaction
                  </h2>
                </div>
                <p className="text-gray-600 mb-6 text-sm font-geist">
                  Fill out the form below to process a new payment transaction
                </p>

                {/* Payment Form */}
                <PaymentForm onSubmit={handlePaymentSubmit} />
              </div>
            </div>

            {/* Right Column - Payment Preview */}
            <div className="space-y-6">
              <PaymentPreview
                paymentData={paymentData}
                onPrint={handlePrintReceipt}
                onDownload={handleDownloadPDF}
                isGenerating={isGenerating}
              />

              {/* Recent Transactions Summary Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 font-geist">
                  Transaction Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-geist">
                      Today's Transactions
                    </span>
                    <span className="text-sm font-medium text-gray-900 font-geist">
                      12
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-geist">
                      Total Revenue
                    </span>
                    <span className="text-sm font-medium text-green-600 font-geist">
                      ₱245,000
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-geist">
                      Pending Payments
                    </span>
                    <span className="text-sm font-medium text-orange-600 font-geist">
                      ₱45,000
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-geist">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 bg-white border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1 px-5 pt-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground font-geist">
              Payment Transactions
            </h1>
            <p className="text-gray-600 mt-1 text-sm font-geist">
              Process client payments for downpayments, monthly loans, and cash
              payments
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 font-geist ${
                activeTab === tab
                  ? "border-foreground text-foreground"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto p-6">{renderTabContent()}</div>
    </div>
  );
}
