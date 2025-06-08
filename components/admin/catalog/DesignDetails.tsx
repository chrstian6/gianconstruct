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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  MoreHorizontal,
  DollarSign,
} from "lucide-react";
import { Design } from "@/types/design";
import { useModalStore } from "@/lib/stores";
import { deleteDesign } from "@/action/designs";
import { toast } from "sonner";
import { calculatePaymentSchedule, formatCurrency } from "@/lib/amortization";

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
  const { isDeleteDesignOpen, setIsDeleteDesignOpen } = useModalStore();

  // Capitalize first letter of each word and lowercase the rest
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
    setCurrentImageIndex((prev) =>
      prev === 0 ? design.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === design.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleConfirmDelete = async () => {
    const result = await deleteDesign(design._id);
    if (result.success) {
      onDelete(design._id);
      toast.success("Design deleted successfully!");
      setIsDeleteDesignOpen(false);
      onBack();
    } else {
      toast.error(result.error || "Failed to delete design");
      setIsDeleteDesignOpen(false);
    }
  };

  // Calculate payment schedule
  const paymentSchedule =
    design.isLoanOffer && design.maxLoanYears && design.interestRate
      ? calculatePaymentSchedule(
          design.price,
          design.maxLoanYears,
          design.interestRate
        )
      : [];

  // Calculate total interest and total amount paid
  const totalInterest = paymentSchedule.reduce(
    (sum, row) => sum + row.interest,
    0
  );
  const totalAmountPaid = design.price + totalInterest;

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="bg-white py-4 relative">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-sm flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Catalog
        </Button>
        <h2 className="text-2xl font-semibold text-center">{design.name}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} className="text-sm">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsDeleteDesignOpen(true, design._id)}
              className="text-sm text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <hr className="my-6 border-t border-gray-200" />
      <div className="flex flex-col gap-6 p-4">
        <p className="text-sm text-muted-foreground text-center">
          Design ID: {design.design_id}
        </p>
        <div>
          <Label className="text-sm font-semibold">Created By:</Label>
          <p className="text-xl">{capitalizeWords(design.createdBy)}</p>
        </div>
        {design.images.length > 0 ? (
          <div className="relative w-full">
            <div className="overflow-hidden rounded-md">
              <img
                src={design.images[currentImageIndex]}
                alt={`${design.name} ${currentImageIndex + 1}`}
                className="w-full max-h-[500px] object-contain rounded-md"
              />
            </div>
            {design.images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white/90"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white/90"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <div className="flex justify-center gap-2 mt-2">
                  {design.images.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        index === currentImageIndex
                          ? "bg-gray-800"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground">
            No images available
          </p>
        )}
        <hr className="my-6 border-t border-gray-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold min-w-[120px]">
              Description:
            </Label>
            <p className="text-base">{capitalizeWords(design.description)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold min-w-[120px]">
              Category:
            </Label>
            <p className="text-base">{capitalizeWords(design.category)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold min-w-[120px]">
              Price:
            </Label>
            <p className="text-base">{formatCurrency(design.price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold min-w-[120px]">
              Number of Rooms:
            </Label>
            <p className="text-base">{design.number_of_rooms}</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold min-w-[120px]">Area:</Label>
            <p className="text-base">
              {formatSquareMeters(design.square_meters)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold min-w-[120px]">
              Loan Offered:
            </Label>
            <p className="text-base">{design.isLoanOffer ? "Yes" : "No"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold min-w-[120px]">
              Created At:
            </Label>
            <p className="text-base">
              {new Date(design.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold min-w-[120px]">
              Updated At:
            </Label>
            <p className="text-base">
              {new Date(design.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        {design.isLoanOffer && design.maxLoanYears && design.interestRate && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md shadow-sm">
            <div className="bg-gray-900 text-white rounded-t-md px-4 py-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Loan Payment Details</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                This design is eligible for a tailored financing plan, allowing
                you to spread the cost of {formatCurrency(design.price)} over a
                maximum term of {design.maxLoanYears} years at a fixed annual
                interest rate of {design.interestRate}%. The following
                amortization schedule outlines monthly payments, covering both
                principal and interest, for the full loan term.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">
                    Total Loan Amount:
                  </Label>
                  <p className="text-sm font-semibold">
                    {formatCurrency(design.price)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Maximum Loan Term:
                  </Label>
                  <p className="text-sm">{design.maxLoanYears} years</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Annual Interest Rate:
                  </Label>
                  <p className="text-sm">{design.interestRate}%</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Effective APR:
                  </Label>
                  <p className="text-sm">{design.interestRate}%</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Monthly Payment:
                  </Label>
                  <p className="text-sm font-semibold">
                    {formatCurrency(paymentSchedule[0]?.payment || 0)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Total Interest Paid:
                  </Label>
                  <p className="text-sm font-semibold">
                    {formatCurrency(totalInterest)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Total Amount Paid:
                  </Label>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalAmountPaid)}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-md font-semibold mb-2">
                  Monthly Payment Breakdown
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-md">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">
                          Month
                        </th>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">
                          Payment
                        </th>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">
                          Principal
                        </th>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">
                          Interest
                        </th>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentSchedule.map((row) => (
                        <tr key={row.month} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b text-sm text-gray-600">
                            {row.month}
                          </td>
                          <td className="py-2 px-4 border-b text-sm text-gray-600">
                            {formatCurrency(row.payment)}
                          </td>
                          <td className="py-2 px-4 border-b text-sm text-gray-600">
                            {formatCurrency(row.principal)}
                          </td>
                          <td className="py-2 px-4 border-b text-sm text-gray-600">
                            {formatCurrency(row.interest)}
                          </td>
                          <td className="py-2 px-4 border-b text-sm text-gray-600">
                            {formatCurrency(row.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        <hr className="my-6 border-t border-gray-200" />
      </div>
      <AlertDialog
        open={isDeleteDesignOpen}
        onOpenChange={setIsDeleteDesignOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this design? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDesignOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
