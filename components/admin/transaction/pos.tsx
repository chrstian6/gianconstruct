"use client";

import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  CreditCard,
  Calculator,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  PaymentType,
  PaymentMethod,
  UserInfo,
  PaymentData,
  generateReferenceNumber,
  formatCurrency,
  getPaymentTypeLabel,
  getPaymentMethodLabel,
  PaymentStatus,
} from "@/types/payment";
import { getUsersForPOS, createPayment } from "@/action/payment";
import { getDesigns } from "@/action/designs";
import { Design } from "@/types/design";
import { toast } from "sonner";

interface POSProps {
  onPaymentProcess: (paymentData: PaymentData) => void;
}

// Lazy Image Component with Loading State
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

function LazyImage({ src, alt, className = "" }: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {hasError ? (
        <div className="w-full h-full bg-muted-foreground/20 rounded-md flex items-center justify-center">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover rounded-md transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          } ${className}`}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
}

export function POS({ onPaymentProcess }: POSProps) {
  const [amount, setAmount] = useState<string>("");
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.CASH);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [designSearchQuery, setDesignSearchQuery] = useState<string>("");
  const [showUserSearch, setShowUserSearch] = useState<boolean>(false);
  const [showDesignSearch, setShowDesignSearch] = useState<boolean>(false);
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([]);
  const [filteredDesigns, setFilteredDesigns] = useState<Design[]>([]);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [allDesigns, setAllDesigns] = useState<Design[]>([]);
  const [recommendedDesigns, setRecommendedDesigns] = useState<Design[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState<boolean>(false);

  // Calculate numeric amount for display
  const numericAmount = parseFloat(amount.replace(/,/g, "")) || 0;

  // Load users and recommended designs on component mount
  useEffect(() => {
    const loadUsers = async () => {
      const result = await getUsersForPOS();
      if (result.success) {
        setAllUsers(result.users);
        setFilteredUsers(result.users);
      } else {
        toast.error("Failed to load users");
      }
    };

    const loadRecommendedDesigns = async () => {
      setIsLoadingDesigns(true);
      const result = await getDesigns();
      if (result.success && result.designs) {
        const designs = result.designs;
        setAllDesigns(designs);

        // Show only 6 recommended designs initially (you can adjust this number)
        const recommended = designs.slice(0, 6);
        setRecommendedDesigns(recommended);
        setFilteredDesigns(recommended);
      } else {
        toast.error("Failed to load designs");
      }
      setIsLoadingDesigns(false);
    };

    loadUsers();
    loadRecommendedDesigns();
  }, []);

  // Format currency input
  const formatNumberWithCommas = (value: string): string => {
    const numeric = value.replace(/[^0-9]/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    setAmount(formatNumberWithCommas(value));
  };

  // Search users
  const handleSearchUsers = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(query.toLowerCase()) ||
          user.lastName.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase()) ||
          user.contactNo.includes(query)
      );
      setFilteredUsers(filtered);
    }
  };

  // Search designs with improved search functionality
  const handleSearchDesigns = async (query: string) => {
    setDesignSearchQuery(query);

    if (query.trim() === "") {
      // Show recommended designs when search is empty
      setFilteredDesigns(recommendedDesigns);
      setShowDesignSearch(false);
    } else {
      setShowDesignSearch(true);

      // Convert query to lowercase for case-insensitive search
      const searchTerm = query.toLowerCase().trim();

      // First, filter from already loaded designs for immediate response
      const immediateResults = allDesigns.filter(
        (design) =>
          design.name.toLowerCase().includes(searchTerm) ||
          design.design_id.toLowerCase().includes(searchTerm) ||
          design.description.toLowerCase().includes(searchTerm) ||
          design.category.toLowerCase().includes(searchTerm)
      );

      setFilteredDesigns(immediateResults);

      // If no results in loaded designs and search term is substantial,
      // you could implement API search here in the future
      if (immediateResults.length === 0 && searchTerm.length >= 2) {
        // Optional: Implement API search for more comprehensive results
        // const searchResult = await searchDesignsAPI(searchTerm);
        // setFilteredDesigns(searchResult);
      }
    }
  };

  // Select user
  const handleSelectUser = (user: UserInfo) => {
    setSelectedUser(user);
    setShowUserSearch(false);
    setSearchQuery("");
  };

  // Select design
  const handleSelectDesign = (design: Design) => {
    setSelectedDesign(design);
    setShowDesignSearch(false);
    setDesignSearchQuery("");

    // Auto-fill amount based on payment type and design
    if (design) {
      let calculatedAmount = 0;

      switch (paymentType) {
        case PaymentType.DOWNPAYMENT:
          calculatedAmount = design.estimated_downpayment;
          break;
        case PaymentType.FULL:
          calculatedAmount = design.price;
          break;
        case PaymentType.MONTHLY:
          // Calculate monthly payment if it's a loan offer
          if (design.isLoanOffer && design.maxLoanTerm && design.interestRate) {
            const loanAmount = design.price - design.estimated_downpayment;
            const monthlyRate = design.interestRate / 100 / 12;
            const numberOfPayments = design.maxLoanTerm;

            // Monthly payment formula: P * (r(1+r)^n) / ((1+r)^n - 1)
            calculatedAmount =
              (loanAmount *
                (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
              (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
          } else {
            // Default to a portion of the price for non-loan monthly payments
            calculatedAmount = design.price * 0.1; // 10% of total price
          }
          break;
        default:
          calculatedAmount = design.price;
      }

      setAmount(formatNumberWithCommas(calculatedAmount.toFixed(0)));
    }
  };

  // Clear user selection
  const handleClearUser = () => {
    setSelectedUser(null);
  };

  // Clear design selection
  const handleClearDesign = () => {
    setSelectedDesign(null);
    setAmount("");
  };

  // Update amount when payment type changes and design is selected
  useEffect(() => {
    if (selectedDesign) {
      handleSelectDesign(selectedDesign);
    }
  }, [paymentType]);

  // Process payment
  const handleProcessPayment = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    if (!selectedDesign) {
      toast.error("Please select a design");
      return;
    }

    if (!amount || parseFloat(amount.replace(/,/g, "")) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);

    try {
      const paymentData: Omit<PaymentData, "id" | "createdAt" | "updatedAt"> = {
        userInfo: selectedUser,
        paymentType,
        paymentMethod,
        amount: parseFloat(amount.replace(/,/g, "")),
        designDetails: {
          name: selectedDesign.name,
          price: selectedDesign.price,
          squareMeters: selectedDesign.square_meters,
          isLoanOffer: selectedDesign.isLoanOffer,
          loanDetails: selectedDesign.isLoanOffer
            ? {
                interestRate: selectedDesign.interestRate || 0,
                loanTerm: selectedDesign.maxLoanTerm || 0,
                downPayment: selectedDesign.estimated_downpayment,
                monthlyPayment: parseFloat(amount.replace(/,/g, "")),
                totalLoanAmount:
                  selectedDesign.price - selectedDesign.estimated_downpayment,
                remainingBalance:
                  selectedDesign.price - selectedDesign.estimated_downpayment,
              }
            : undefined,
        },
        status: PaymentStatus.COMPLETED,
        transactionDate: new Date().toISOString(),
        referenceNumber: generateReferenceNumber(),
        notes,
      };

      const result = await createPayment(paymentData);

      if (result.success && result.payment) {
        toast.success("Payment processed successfully!");
        onPaymentProcess(result.payment);

        // Reset form
        setAmount("");
        setNotes("");
        setSelectedUser(null);
        setSelectedDesign(null);
      } else {
        toast.error(result.error || "Failed to process payment");
      }
    } catch (error) {
      toast.error("An error occurred while processing payment");
      console.error("Payment error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Amount Display - Centered without card */}
      <div className="text-center p-8 rounded-lg">
        <div className="text-muted-foreground text-sm font-medium pb-3 font-geist">
          Amount
        </div>
        <div className="text-5xl font-bold text-foreground mb-4 font-geist">
          {formatCurrency(numericAmount)}
        </div>
        <div className="flex justify-center gap-3 text-muted-foreground items-center">
          {getPaymentTypeLabel(paymentType)}
          {selectedDesign?.isLoanOffer && (
            <Badge
              variant="default"
              className="bg-orange-100 text-orange-800 text-base px-3 py-1 font-geist"
            >
              Loan
            </Badge>
          )}
        </div>
      </div>

      {/* Payment Form - No cards, just inputs */}
      <div className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label
            htmlFor="amount"
            className="text-md font-medium pb-3 font-geist"
          >
            Amount (₱)
          </Label>
          <Input
            id="amount"
            type="text"
            value={amount ? `₱${amount}` : ""}
            onChange={(e) =>
              handleAmountChange(e.target.value.replace("₱", ""))
            }
            placeholder="Enter payment amount"
            className="text-lg font-semibold h-12 font-geist"
          />
        </div>

        {/* Payment Type and Method */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="paymentType"
              className="text-md font-medium pb-3 font-geist"
            >
              Payment Type
            </Label>
            <Select
              value={paymentType}
              onValueChange={(value: PaymentType) => setPaymentType(value)}
            >
              <SelectTrigger className="h-12 font-geist">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-geist">
                <SelectItem value={PaymentType.DOWNPAYMENT}>
                  Down Payment
                </SelectItem>
                <SelectItem value={PaymentType.MONTHLY}>
                  Monthly Payment
                </SelectItem>
                <SelectItem value={PaymentType.CASH}>Cash Payment</SelectItem>
                <SelectItem value={PaymentType.FULL}>Full Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="paymentMethod"
              className="text-md font-medium pb-3 font-geist"
            >
              Payment Method
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
            >
              <SelectTrigger className="h-12 font-geist">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-geist">
                <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                <SelectItem value={PaymentMethod.CARD}>
                  Credit/Debit Card
                </SelectItem>
                <SelectItem value={PaymentMethod.BANK_TRANSFER}>
                  Bank Transfer
                </SelectItem>
                <SelectItem value={PaymentMethod.CHECK}>Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* User Selection */}
        <div className="space-y-2">
          <Label className="text-md font-medium pb-3 flex items-center gap-2 font-geist">
            <User className="h-4 w-4" />
            Customer
          </Label>

          {selectedUser ? (
            <div className="p-4 border border-border rounded-lg bg-muted font-geist">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-medium text-foreground">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedUser.email}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedUser.contactNo}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedUser.address}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearUser}
                  className="font-geist"
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    handleSearchUsers(e.target.value);
                    setShowUserSearch(true);
                  }}
                  onFocus={() => setShowUserSearch(true)}
                  className="pl-10 h-12 font-geist"
                />
              </div>

              {showUserSearch && filteredUsers.length > 0 && (
                <div className="border border-border rounded-lg max-h-60 overflow-y-auto font-geist">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.contactNo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Design Selection */}
        <div className="space-y-2">
          <Label className="text-md font-medium pb-3 flex items-center gap-2 font-geist">
            <Home className="h-4 w-4" />
            Design Selection
          </Label>

          {selectedDesign ? (
            <div className="p-4 border border-border rounded-lg bg-muted font-geist">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 flex-shrink-0">
                      <LazyImage
                        src={selectedDesign.images?.[0] || ""}
                        alt={selectedDesign.name}
                        className="w-16 h-16"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {selectedDesign.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedDesign.description}
                      </div>
                      <div className="flex gap-4 mt-2 text-sm">
                        <div>
                          <span className="font-medium">Price:</span>{" "}
                          {formatCurrency(selectedDesign.price)}
                        </div>
                        <div>
                          <span className="font-medium">Down Payment:</span>{" "}
                          {formatCurrency(selectedDesign.estimated_downpayment)}
                        </div>
                        <div>
                          <span className="font-medium">Area:</span>{" "}
                          {selectedDesign.square_meters} sqm
                        </div>
                      </div>
                      {selectedDesign.isLoanOffer && (
                        <div className="mt-1">
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            Loan Available
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDesign}
                  className="font-geist ml-4"
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search designs by name, ID, description, or category..."
                  value={designSearchQuery}
                  onChange={(e) => handleSearchDesigns(e.target.value)}
                  onFocus={() => {
                    if (designSearchQuery) {
                      setShowDesignSearch(true);
                    }
                  }}
                  className="pl-10 h-12 font-geist"
                />
              </div>

              {showDesignSearch && (
                <div className="border border-border rounded-lg max-h-60 overflow-y-auto font-geist">
                  {isLoadingDesigns ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Loading designs...
                    </div>
                  ) : filteredDesigns.length > 0 ? (
                    filteredDesigns.map((design) => (
                      <div
                        key={design.design_id}
                        className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                        onClick={() => handleSelectDesign(design)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 flex-shrink-0">
                            <LazyImage
                              src={design.images?.[0] || ""}
                              alt={design.name}
                              className="w-12 h-12"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {design.name}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              ID: {design.design_id} • {design.category} •{" "}
                              {design.square_meters} sqm
                            </div>
                            <div className="text-sm font-medium">
                              {formatCurrency(design.price)}
                            </div>
                          </div>
                          {design.isLoanOffer && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800 text-xs flex-shrink-0"
                            >
                              Loan
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No designs found matching "{designSearchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label
            htmlFor="notes"
            className="text-md font-medium pb-3 font-geist"
          >
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes about this payment..."
            rows={3}
            className="font-geist"
          />
        </div>

        {/* Process Payment Button */}
        <Button
          onClick={handleProcessPayment}
          disabled={isLoading || !selectedUser || !selectedDesign || !amount}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg font-geist"
        >
          {isLoading ? "Processing..." : "Process Payment"}
        </Button>
      </div>
    </div>
  );
}
