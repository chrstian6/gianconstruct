// components/admin/supplier/ViewSupplierModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModalStore } from "@/lib/stores";
import { ISupplier } from "@/types/supplier";
import {
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BadgeCheck,
  Clock,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ViewSupplierModalProps {
  supplier: ISupplier | null;
  onEdit?: (supplier: ISupplier) => void;
  onDelete?: (supplier: ISupplier) => void;
}

export function ViewSupplierModal({
  supplier,
  onEdit,
  onDelete,
}: ViewSupplierModalProps) {
  // FIX: Use isViewSupplierOpen and setIsViewSupplierOpen instead of isEditUserOpen
  const { isViewSupplierOpen, setIsViewSupplierOpen, viewingSupplier } =
    useModalStore();

  // Use the supplier from props OR from the store (for consistency)
  const currentSupplier = supplier || viewingSupplier;

  if (!currentSupplier) return null;

  const formatContact = (contact: string | undefined | null) => {
    if (!contact) return "N/A";

    // Remove any non-digit characters first
    const digitsOnly = contact.replace(/\D/g, "");

    // Format as XXXX-XXX-XXXX if we have 11 digits
    if (digitsOnly.length === 11) {
      return digitsOnly.replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3");
    }

    // Return as is if not exactly 11 digits
    return contact;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <BadgeCheck className="h-4 w-4 text-green-600" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-700 bg-green-50 border-green-200";
      case "inactive":
        return "text-red-700 bg-red-50 border-red-200";
      case "pending":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(currentSupplier);
    }
    setIsViewSupplierOpen(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(currentSupplier);
    }
    setIsViewSupplierOpen(false);
  };

  // FIX: Use isViewSupplierOpen and setIsViewSupplierOpen
  return (
    <Dialog open={isViewSupplierOpen} onOpenChange={setIsViewSupplierOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-geist">
            <Building className="h-6 w-6" />
            Supplier Details
          </DialogTitle>
          <DialogDescription className="font-geist">
            Complete information about {currentSupplier.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 font-geist truncate">
                  {currentSupplier.companyName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(currentSupplier.status)}
                  <Badge
                    variant={getStatusVariant(currentSupplier.status)}
                    className={`capitalize border ${getStatusColor(currentSupplier.status)}`}
                  >
                    {currentSupplier.status}
                  </Badge>
                  <span className="text-xs text-gray-500 font-mono font-geist">
                    ID: {currentSupplier.supplier_id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center gap-2 font-geist"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 font-geist"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 font-geist flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Person */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-geist">
                  Contact Person
                </label>
                <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900 font-geist">
                    {currentSupplier.contactPerson}
                  </span>
                </div>
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-geist">
                  Contact Number
                </label>
                <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900 font-mono font-geist">
                    {formatContact(currentSupplier.contact)}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-geist">
                  Email Address
                </label>
                <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900 font-geist">
                    {currentSupplier.email || "Not provided"}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-geist">
                  Location
                </label>
                <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900 font-geist">
                    {currentSupplier.location}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 font-geist flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Additional Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-geist">
                  Supplier ID
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <code className="text-sm text-gray-900 font-mono font-geist">
                    {currentSupplier.supplier_id}
                  </code>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-geist">
                  Account Status
                </label>
                <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md">
                  {getStatusIcon(currentSupplier.status)}
                  <span className="text-gray-900 font-geist capitalize">
                    {currentSupplier.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Description */}
          <div
            className={`p-4 rounded-lg border ${getStatusColor(currentSupplier.status)}`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(currentSupplier.status)}
              <div className="flex-1">
                <h5 className="font-semibold font-geist mb-1">
                  {currentSupplier.status === "active" && "Active Supplier"}
                  {currentSupplier.status === "inactive" && "Inactive Supplier"}
                  {currentSupplier.status === "pending" && "Pending Approval"}
                </h5>
                <p className="text-sm font-geist">
                  {currentSupplier.status === "active" &&
                    "This supplier is currently active and can be used for inventory purchases."}
                  {currentSupplier.status === "inactive" &&
                    "This supplier is currently inactive and cannot be used for new purchases."}
                  {currentSupplier.status === "pending" &&
                    "This supplier is pending approval and cannot be used until activated."}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsViewSupplierOpen(false)}
              className="flex-1 font-geist"
            >
              Close
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              {onEdit && (
                <Button
                  onClick={handleEdit}
                  className="flex-1 font-geist bg-gray-900 hover:bg-gray-800"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Supplier
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="flex-1 font-geist text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Supplier
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
