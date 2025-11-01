"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { InventoryPOS } from "@/components/admin/transaction/inventory-pos";
import { ReceiptHistory } from "@/components/admin/transaction/receipt-history";
import { toast } from "sonner";
import { PaymentData as POSPaymentData } from "@/types/payment";
import { InventoryPOSPayment } from "@/types/inventory-pos";
import {
  getInventoryPOSTransactions,
  getFullInventoryPOSTransaction,
  voidInventoryPOSTransaction,
} from "@/action/inventoryPOS";

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

const TABS = [
  "Overview",
  "Inventory PoS",
  "Billing",
  "Loan Payments",
  "Invoice",
  "Transaction History",
  "Receipt History",
];

const TAB_TO_SLUG: Record<string, string> = {
  Overview: "overview",
  "Inventory PoS": "inventory-pos",
  Billing: "billing",
  "Loan Payments": "loan-payments",
  Invoice: "invoice",
  "Transaction History": "transaction-history",
  "Receipt History": "receipt-history",
};

const SLUG_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_TO_SLUG).map(([tab, slug]) => [slug, tab])
);

// Helper function to check if receipt is voided
const isVoided = (receipt: InventoryPOSPayment) => {
  return (
    receipt.status === "voided" ||
    (receipt.status === "failed" && receipt.notes?.includes("VOIDED"))
  );
};

export default function TransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [inventoryPaymentData, setInventoryPaymentData] =
    useState<InventoryPOSPayment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview"); // Default is Overview
  const [isLoading, setIsLoading] = useState(true);
  const [receipts, setReceipts] = useState<InventoryPOSPayment[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);
  const [inventoryKey, setInventoryKey] = useState(Date.now()); // Use timestamp for unique key

  // Load receipts from database using existing action
  const loadReceipts = async () => {
    setIsLoadingReceipts(true);
    try {
      const result = await getInventoryPOSTransactions(100, 0);
      if (result.success) {
        // Load full details for each transaction
        const receiptsWithDetails = await Promise.all(
          result.transactions.map(async (txn) => {
            const fullResult = await getFullInventoryPOSTransaction(txn.id);
            if (fullResult.success && fullResult.transaction) {
              return fullResult.transaction;
            }
            // Fallback to basic info if full details fail
            return {
              id: txn.id,
              referenceNumber: txn.referenceNumber,
              transactionDate: txn.transactionDate,
              clientInfo: {
                clientName: txn.clientName,
                clientEmail: txn.clientEmail || "",
                clientPhone: txn.clientPhone || "",
                clientAddress: "",
              },
              paymentMethod: txn.paymentMethod,
              paymentType: txn.paymentType,
              items: [],
              subtotal: txn.totalAmount,
              discountAmount: 0,
              discountPercentage: 0,
              taxAmount: 0,
              taxPercentage: 0,
              totalAmount: txn.totalAmount,
              amountPaid: txn.totalAmount,
              change: 0,
              status: txn.status,
            } as InventoryPOSPayment;
          })
        );
        setReceipts(receiptsWithDetails);
      } else {
        toast.error(result.error || "Failed to load receipts");
      }
    } catch (error) {
      toast.error("Error loading receipts");
      console.error("Error loading receipts:", error);
    } finally {
      setIsLoadingReceipts(false);
    }
  };

  // Initialize from URL or localStorage on mount and load receipts
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const storedTab = localStorage.getItem("transactionActiveTab");

    // ALWAYS START WITH OVERVIEW AS DEFAULT
    let initialTab = "Overview";

    // Only override if URL has a valid tab that's NOT Overview
    if (
      tabFromUrl &&
      SLUG_TO_TAB[tabFromUrl] &&
      SLUG_TO_TAB[tabFromUrl] !== "Overview"
    ) {
      initialTab = SLUG_TO_TAB[tabFromUrl];
    }
    // Ignore localStorage for initial load to ensure Overview is default

    setActiveTab(initialTab);

    // Update URL to match the active tab
    const slug = TAB_TO_SLUG[initialTab];
    router.push(`?tab=${slug}`, { scroll: false });

    // Load receipts from database
    loadReceipts();

    setIsLoading(false);
  }, [searchParams, router]);

  // Update URL and localStorage when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("transactionActiveTab", tab);
    const slug = TAB_TO_SLUG[tab];
    router.push(`?tab=${slug}`, { scroll: false });

    // Force remount of InventoryPOS component when switching to it
    if (tab === "Inventory PoS") {
      setInventoryKey(Date.now()); // New unique key each time
    }
  };

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

  const handleInventoryPOSPayment = (data: InventoryPOSPayment) => {
    setInventoryPaymentData(data);

    // Add the new receipt to receipts list and reload from database
    setReceipts((prev) => [data, ...prev]);

    toast.success("Inventory transaction completed successfully!");
  };

  const handlePrintReceipt = (receipt: InventoryPOSPayment) => {
    setIsGenerating(true);
    setTimeout(() => {
      console.log("Printing receipt:", receipt);
      window.print();
      setIsGenerating(false);
      toast.success("Receipt printed successfully!");
    }, 1000);
  };

  const handleVoidReceipt = async (
    receiptId: string,
    reason: string,
    password: string
  ) => {
    // Validate password
    if (!password || password.trim() === "") {
      toast.error("Please enter a valid password");
      return;
    }

    // Simple password validation - replace with your actual validation
    const isValidPassword = password === "admin123";

    if (!isValidPassword) {
      toast.error("Invalid password");
      return;
    }

    if (
      confirm(
        `Are you sure you want to void receipt ${receiptId}? This action cannot be undone and will restore inventory quantities.\n\nReason: ${reason}`
      )
    ) {
      try {
        const result = await voidInventoryPOSTransaction(
          receiptId,
          reason.trim()
        );
        if (result.success) {
          // Update the receipt in local state with proper void handling
          setReceipts((prev) =>
            prev.map((receipt) =>
              receipt.id === receiptId
                ? {
                    ...receipt,
                    status: "voided" as const,
                    notes: reason
                      ? `VOIDED: ${reason}`
                      : "VOIDED: No reason provided",
                  }
                : receipt
            )
          );

          // Refresh the receipts to get updated totals
          loadReceipts();

          toast.success(
            `Receipt voided successfully! Inventory quantities restored and ₱${result.transaction?.amountSubtracted?.toFixed(2) || "amount"} subtracted from total sales.`
          );
        } else {
          toast.error(result.error || "Failed to void receipt");
        }
      } catch (error: any) {
        console.error("Error voiding receipt:", error);
        toast.error("Error voiding receipt");
      }
    }
  };

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      toast.success("PDF downloaded successfully!");
      setIsGenerating(false);
    }, 1000);
  };

  const refreshReceipts = () => {
    loadReceipts();
    toast.success("Receipts refreshed!");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Inventory PoS":
        return (
          <InventoryPOS
            key={inventoryKey} // Force fresh mount with unique key
            onPaymentProcess={handleInventoryPOSPayment}
          />
        );
      case "Receipt History":
        return (
          <div className="h-full overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 font-geist">
                Receipt History
              </h2>
              <Button
                onClick={refreshReceipts}
                variant="outline"
                disabled={isLoadingReceipts}
                className="flex items-center gap-2"
              >
                {isLoadingReceipts ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <Receipt className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
            <ReceiptHistory
              receipts={receipts}
              onPrint={handlePrintReceipt}
              onVoid={handleVoidReceipt}
            />
            {isLoadingReceipts && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading receipts...</p>
              </div>
            )}
          </div>
        );
      case "Overview":
      default:
        return (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 font-geist mb-2">
                  Transaction Management
                </h2>
                <p className="text-gray-600 mb-6 text-lg font-geist">
                  Use the Inventory PoS tab to process payments and manage
                  transactions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 font-geist mb-2">
                      Total Receipts
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 font-geist">
                      {receipts.length}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 font-geist mb-2">
                      Total Revenue
                    </h3>
                    <p className="text-3xl font-bold text-green-600 font-geist">
                      ₱
                      {receipts
                        .filter((r) => !isVoided(r))
                        .reduce((sum, receipt) => sum + receipt.totalAmount, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                    <h3 className="text-lg font-semibold text-red-900 font-geist mb-2">
                      Voided Receipts
                    </h3>
                    <p className="text-3xl font-bold text-red-600 font-geist">
                      {receipts.filter((receipt) => isVoided(receipt)).length}
                    </p>
                  </div>
                </div>
                <div className="mt-8">
                  <p className="text-gray-500 text-sm font-geist">
                    Navigate to the tabs above to access specific transaction
                    features
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background font-geist">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1 px-5 pt-5 pb-0">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground font-geist">
              Payment Transactions
            </h1>
            <p className="text-gray-600 mt-1 text-sm font-geist">
              Process client payments for downpayments, monthly loans, cash
              payments, and inventory items
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 mt-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 font-geist whitespace-nowrap ${
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

      {/* Content Section */}
      <div className="flex-1 overflow-hidden">{renderTabContent()}</div>
    </div>
  );
}
