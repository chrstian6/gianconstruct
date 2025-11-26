// components/user/projects/ConfirmProjectDrawer.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/project";
import {
  X,
  Loader2,
  Calendar,
  CheckCircle,
  MapPin,
  DollarSign,
  FileText,
  CreditCard,
  Percent,
  Landmark,
} from "lucide-react";
import ProposedDesignTab from "@/components/admin/projects/design/ProposedDesignTab";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

interface ConfirmProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onConfirm: (projectId: string, downpaymentAmount: number) => void;
  isConfirming: boolean;
}

type DownpaymentOption = "25" | "30" | "50" | "custom";

export default function ConfirmProjectDrawer({
  isOpen,
  onClose,
  project,
  onConfirm,
  isConfirming,
}: ConfirmProjectDrawerProps) {
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [downpaymentOption, setDownpaymentOption] =
    React.useState<DownpaymentOption>("30");
  const [customDownpayment, setCustomDownpayment] = React.useState("");

  // Calculate downpayment amount - MOVED TO TOP
  const calculateDownpayment = () => {
    const totalCost = project?.totalCost ?? 0;

    if (downpaymentOption === "custom") {
      const customAmount = parseFloat(customDownpayment) || 0;
      return Math.min(customAmount, totalCost);
    }

    const percentage = parseInt(downpaymentOption);
    return Math.ceil(totalCost * (percentage / 100));
  };

  // Calculate downpayment amount - MOVED TO TOP
  const downpaymentAmount = calculateDownpayment();
  const totalCost = project?.totalCost ?? 0;
  const remainingAmount = totalCost - downpaymentAmount;
  const downpaymentPercentage =
    totalCost > 0 ? Math.round((downpaymentAmount / totalCost) * 100) : 0;

  const handleConfirm = () => {
    if (project && acceptedTerms) {
      // Ensure downpaymentAmount is a valid number
      const amountToSend = Number(downpaymentAmount);
      console.log("💰 Sending project confirmation:", {
        projectId: project.project_id,
        downpaymentAmount: amountToSend,
      });

      if (isNaN(amountToSend) || amountToSend <= 0) {
        console.error(
          "❌ Invalid downpayment amount calculated:",
          downpaymentAmount
        );
        return;
      }

      onConfirm(project.project_id, amountToSend);
    }
  };

  // Add debug logging
  React.useEffect(() => {
    console.log("🔍 Downpayment calculation debug:", {
      downpaymentOption,
      customDownpayment,
      totalCost: project?.totalCost,
      calculatedAmount: downpaymentAmount,
      acceptedTerms,
    });
  }, [
    downpaymentOption,
    customDownpayment,
    project?.totalCost,
    downpaymentAmount,
    acceptedTerms,
  ]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle custom input changes with validation
  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^\d]/g, "");
    setCustomDownpayment(numericValue);
  };

  // Format display value with commas
  const formatDisplayValue = (value: string) => {
    if (!value) return "";
    const number = parseInt(value.replace(/,/g, ""));
    if (isNaN(number)) return "";
    return number.toLocaleString("en-PH");
  };

  // Reset terms and downpayment selection when drawer closes
  React.useEffect(() => {
    if (!isOpen) {
      setAcceptedTerms(false);
      setDownpaymentOption("30");
      setCustomDownpayment("");
    }
  }, [isOpen]);

  // Early return after all hooks
  if (!project) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[95vh] max-h-[95vh]">
        <DrawerHeader className="px-6 py-4 border-b border-zinc-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                <FileText className="h-5 w-5 text-zinc-700" />
              </div>
              <div>
                <DrawerTitle className="text-xl font-bold text-zinc-900">
                  Review Project Proposal
                </DrawerTitle>
                <DrawerDescription className="text-sm text-zinc-600 mt-1">
                  Carefully review all details before confirming
                </DrawerDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Project Overview */}
            <Card className="border-zinc-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                  Project Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-zinc-500 mb-2">
                        Project ID
                      </div>
                      <Badge
                        variant="outline"
                        className="text-sm font-mono bg-zinc-50 px-3 py-1"
                      >
                        {project.project_id}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-500 mb-2">
                        Project Name
                      </div>
                      <div className="text-base text-zinc-900 font-medium">
                        {project.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-500 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>
                      <div className="text-base text-zinc-900">
                        {project.location?.fullAddress || "Construction Site"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-zinc-500 mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Timeline
                      </div>
                      <div className="text-base text-zinc-900 space-y-1">
                        <div>Start: {formatDate(project.startDate)}</div>
                        <div>
                          Completion:{" "}
                          {project.endDate
                            ? formatDate(project.endDate)
                            : "To be determined"}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-500 mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Total Budget
                      </div>
                      <div className="text-xl font-bold text-zinc-900">
                        ₱{(project.totalCost ?? 0).toLocaleString("en-PH")}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proposed Design Images */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                Proposed Design
              </h3>
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <ProposedDesignTab project={project} />
              </div>
            </div>

            {/* Downpayment Selection */}
            <Card className="border-zinc-200 bg-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Downpayment & Payment
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium text-zinc-900 mb-3 block">
                      Select Downpayment Amount
                    </Label>
                    <RadioGroup
                      value={downpaymentOption}
                      onValueChange={(value: DownpaymentOption) => {
                        setDownpaymentOption(value);
                        if (value !== "custom") {
                          setCustomDownpayment("");
                        }
                      }}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-4 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer">
                        <RadioGroupItem value="25" id="25" />
                        <Label htmlFor="25" className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">25% Downpayment</span>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              ₱{(totalCost * 0.25).toLocaleString("en-PH")}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-600 mt-1">
                            Lower initial payment
                          </p>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer">
                        <RadioGroupItem value="30" id="30" />
                        <Label htmlFor="30" className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">30% Downpayment</span>
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              ₱{(totalCost * 0.3).toLocaleString("en-PH")}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-600 mt-1">
                            Standard option
                          </p>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer">
                        <RadioGroupItem value="50" id="50" />
                        <Label htmlFor="50" className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">50% Downpayment</span>
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200"
                            >
                              ₱{(totalCost * 0.5).toLocaleString("en-PH")}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-600 mt-1">
                            Higher initial payment
                          </p>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label
                          htmlFor="custom"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="font-medium">Custom Amount</span>
                              {downpaymentOption === "custom" && (
                                <p className="text-sm text-zinc-600 mt-1">
                                  Enter any amount up to ₱
                                  {totalCost.toLocaleString("en-PH")}
                                </p>
                              )}
                            </div>
                          </div>
                          {downpaymentOption === "custom" && (
                            <div className="flex items-center gap-3 bg-white border border-zinc-300 rounded-lg px-3 py-3 focus-within:ring-2 focus-within:ring-zinc-900 focus-within:border-zinc-900 transition-all min-h-[56px] w-48 mt-3 ml-auto">
                              <span className="text-lg font-medium text-zinc-700">
                                ₱
                              </span>
                              <Input
                                type="text"
                                placeholder="Enter amount"
                                value={formatDisplayValue(customDownpayment)}
                                onChange={(e) =>
                                  handleCustomAmountChange(e.target.value)
                                }
                                className="h-8 text-lg font-medium border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 shadow-none flex-1 min-w-0"
                              />
                            </div>
                          )}
                        </Label>
                        {downpaymentOption === "custom" && (
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200"
                          >
                            Custom
                          </Badge>
                        )}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Payment Summary */}
                  <div className="mt-6 p-4 border border-zinc-200 rounded-lg bg-zinc-50">
                    <h4 className="font-semibold text-zinc-900 mb-3">
                      Payment Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-zinc-200">
                        <div className="flex items-center gap-3">
                          <Percent className="h-4 w-4 text-zinc-600" />
                          <span className="text-sm font-medium text-zinc-700">
                            Downpayment ({downpaymentPercentage}%)
                          </span>
                        </div>
                        <span className="text-lg font-bold text-zinc-900">
                          ₱{downpaymentAmount.toLocaleString("en-PH")}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-4 w-4 text-zinc-600" />
                          <span className="text-sm font-medium text-zinc-700">
                            Balance upon completion
                          </span>
                        </div>
                        <span className="text-lg font-bold text-zinc-900">
                          ₱{remainingAmount.toLocaleString("en-PH")}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-zinc-300">
                        <span className="font-semibold text-zinc-900">
                          Total Project Cost
                        </span>
                        <span className="text-xl font-bold text-zinc-900">
                          ₱{totalCost.toLocaleString("en-PH")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="p-4 border border-zinc-200 rounded-lg bg-white">
                    <h4 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      Payment Method
                    </h4>
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">
                          Cash Payment Only
                        </p>
                        <p className="text-sm text-zinc-600">
                          All payments must be made in cash
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-zinc-600 space-y-1">
                      <p className="font-medium text-zinc-700">
                        Payment Instructions:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          Downpayment must be paid in cash upon project
                          confirmation
                        </li>
                        <li>
                          Balance must be paid in cash upon project completion
                        </li>
                        <li>
                          Official receipts will be provided for all cash
                          payments
                        </li>
                        <li>
                          Payments should be made at our office during business
                          hours
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms and Agreement */}
            <Card className="border-zinc-200 bg-zinc-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Terms & Agreement
                </h3>
                <div className="space-y-4 text-sm text-zinc-700">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-zinc-900">
                      Project Confirmation Agreement
                    </h4>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>
                        I have thoroughly reviewed the proposed design, project
                        specifications, and all associated documentation
                      </li>
                      <li>
                        I understand that upon confirmation, this project will
                        move to active status and construction will commence
                      </li>
                      <li>
                        I acknowledge the project timeline, budget, and scope as
                        presented
                      </li>
                      <li>
                        I agree to pay the selected downpayment amount of ₱
                        {downpaymentAmount.toLocaleString("en-PH")} (
                        {downpaymentPercentage}%) in cash upon confirmation
                      </li>
                      <li>
                        I understand that the remaining balance of ₱
                        {remainingAmount.toLocaleString("en-PH")} must be paid
                        in full in cash upon project completion
                      </li>
                      <li>
                        I confirm that the proposed design meets my requirements
                        and expectations
                      </li>
                      <li>
                        I understand that any subsequent changes to the design
                        or scope may incur additional costs
                      </li>
                      <li>
                        I acknowledge that project progress will be communicated
                        through regular updates
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-zinc-900">
                      Payment & Schedule Terms
                    </h4>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>
                        Downpayment is required to secure materials and schedule
                        construction
                      </li>
                      <li>All payments must be made in cash only</li>
                      <li>
                        The remaining balance must be paid in full in cash
                        before project handover
                      </li>
                      <li>
                        Construction timeline is subject to weather conditions
                        and other unforeseen circumstances
                      </li>
                      <li>
                        Regular site visits and progress meetings will be
                        scheduled as needed
                      </li>
                      <li>Late payments may result in project delays</li>
                      <li>
                        Project completion is defined as all work being finished
                        according to specifications
                      </li>
                      <li>
                        Official receipts will be provided for all cash payments
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Terms Acceptance Checkbox */}
                <div className="mt-6 p-4 border border-zinc-200 rounded-lg bg-white">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms-acceptance"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) =>
                        setAcceptedTerms(checked as boolean)
                      }
                      className="mt-0.5 data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="terms-acceptance"
                        className="text-sm font-medium text-zinc-900 leading-none cursor-pointer"
                      >
                        I accept the terms and conditions
                      </Label>
                      <p className="text-xs text-zinc-600">
                        By checking this box, I acknowledge that I have read,
                        understood, and agree to all the terms and conditions
                        outlined above, including the downpayment amount, full
                        payment upon completion requirement, and cash-only
                        payment policy.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                      <span className="text-blue-600 text-sm font-bold">!</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-blue-900 text-lg mb-3">
                      Final Confirmation
                    </h5>
                    <div className="text-blue-800 text-base leading-relaxed space-y-2">
                      <p>
                        This is your final opportunity to review all project
                        details before confirmation. Once confirmed, the project
                        will proceed to the construction phase.
                      </p>
                      <p className="font-medium">
                        Please ensure you are completely satisfied with all
                        aspects of the project proposal, selected downpayment
                        amount, and understand the cash-only payment policy
                        before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-zinc-200 bg-white p-6">
          <div className="max-w-4xl mx-auto flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isConfirming}
              className="flex-1 h-12 text-base font-medium border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel Review
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming || !acceptedTerms}
              className="flex-1 h-12 bg-zinc-900 hover:bg-zinc-800 text-white text-base font-medium disabled:bg-zinc-300 disabled:cursor-not-allowed"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Confirming Project...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Confirm Project Start
                </>
              )}
            </Button>
          </div>
          {!acceptedTerms && (
            <p className="text-center text-sm text-red-600 mt-2">
              Please accept the terms and conditions to continue
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
