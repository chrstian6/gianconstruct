// components/admin/inventory/InventoryDetailsDialog.tsx
"use client";

import { IInventory } from "@/types/Inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Hash,
  Tag,
  FileText,
  DollarSign,
  AlertTriangle,
  MapPin,
  Truck,
  Clock,
  Edit,
  TrendingUp,
} from "lucide-react";

interface InventoryDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  viewingInventory: IInventory | null;
  onEdit?: (item: IInventory) => void;
}

export function InventoryDetailsDialog({
  isOpen,
  onOpenChange,
  viewingInventory,
  onEdit,
}: InventoryDetailsDialogProps) {
  const handleCloseDialog = () => {
    onOpenChange(false);
  };

  const handleEditItem = (item: IInventory) => {
    if (onEdit) {
      onEdit(item);
    }
    handleCloseDialog();
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${formattedDate} : ${formattedTime}`;
    } catch {
      return "N/A";
    }
  };

  if (!viewingInventory) return null;

  // Calculate financial values
  const unitCost = viewingInventory.unitCost ?? 0;
  const salePrice = viewingInventory.salePrice ?? 0;
  const totalCapital =
    viewingInventory.totalCapital ?? viewingInventory.quantity * unitCost;
  const totalValue =
    viewingInventory.totalValue ?? viewingInventory.quantity * salePrice;
  const profit = totalValue - totalCapital;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {viewingInventory.name}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Complete inventory details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span>Product ID</span>
                </div>
                <p className="text-sm font-mono">
                  {viewingInventory.product_id}
                </p>
              </div>
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>Category</span>
                </div>
                <Badge variant="outline" className="mt-1">
                  {viewingInventory.category}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <FileText className="h-4 w-4" />
                <span>Description</span>
              </div>
              <p className="text-sm">
                {viewingInventory.description || "No description provided"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">
                  Unit
                </div>
                <p className="text-sm uppercase font-medium">
                  {viewingInventory.unit}
                </p>
              </div>
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">
                  Reorder Point
                </div>
                <p className="text-sm font-medium">
                  {viewingInventory.reorderPoint?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Financial Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Base Price</span>
                </div>
                <p className="text-lg font-bold">
                  ₱
                  {unitCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Sale Price</span>
                </div>
                <p className="text-lg font-bold">
                  ₱
                  {salePrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Capital</span>
                </div>
                <p className="text-lg font-bold text-green-900">
                  ₱
                  {totalCapital.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="space-y-1 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <TrendingUp className="h-4 w-4" />
                  <span>Total Value</span>
                </div>
                <p className="text-lg font-bold text-blue-900">
                  ₱
                  {totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="space-y-1 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                  <TrendingUp className="h-4 w-4" />
                  <span>Potential Profit</span>
                </div>
                <p className="text-lg font-bold text-purple-900">
                  ₱
                  {profit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Inventory Status Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Inventory Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">
                  Quantity
                </div>
                <p className="text-lg font-bold">
                  {viewingInventory.quantity.toLocaleString()}
                </p>
                <p className="text-xs text-muted-500 uppercase">
                  {viewingInventory.unit}
                </p>
              </div>
              <div className="space-y-1 p-3 rounded-lg border">
                {viewingInventory.quantity === 0 ? (
                  <div className="border border-destructive/20 bg-destructive/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                    <Badge variant="destructive" className="mt-1 text-sm">
                      Out of Stock
                    </Badge>
                  </div>
                ) : viewingInventory.quantity <=
                  (viewingInventory.reorderPoint || 0) ? (
                  <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="mt-1 bg-amber-200 text-amber-900 hover:bg-amber-300 text-sm"
                    >
                      Low Stock
                    </Badge>
                  </div>
                ) : (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                      <span>Status</span>
                    </div>
                    <Badge
                      variant="default"
                      className="mt-1 bg-green-200 text-green-900 hover:bg-green-300 text-sm"
                    >
                      In Stock
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location & Supplier Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Location & Supplier
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </div>
                <p className="text-sm font-medium">
                  {viewingInventory.location || "Not specified"}
                </p>
              </div>
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>Supplier</span>
                </div>
                <p className="text-sm font-medium">
                  {viewingInventory.supplier || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Timestamps
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <p className="text-xs">
                  {formatDateTime(viewingInventory.timeCreated)}
                </p>
              </div>
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last Updated</span>
                </div>
                <p className="text-xs">
                  {formatDateTime(viewingInventory.timeUpdated)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCloseDialog}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            onClick={() => handleEditItem(viewingInventory)}
            className="flex-1"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
