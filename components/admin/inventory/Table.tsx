"use client";

import { IInventory } from "@/types/Inventory";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Tag,
  Calendar,
  Building,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface InventoryTableProps {
  items: IInventory[];
  loading: boolean;
  onDelete: (item: IInventory) => void;
  onEdit?: (item: IInventory) => void;
  onViewDetails: (item: IInventory) => void;
  columnVisibility: {
    id: boolean;
    name: boolean;
    category: boolean;
    quantity: boolean;
    unit: boolean;
    unitCost: boolean;
    salePrice: boolean;
    totalCapital: boolean;
    totalValue: boolean;
    location: boolean;
    supplier: boolean;
    reorderPoint: boolean;
    status: boolean;
    actions: boolean;
  };
}

export function InventoryTable({
  items,
  loading,
  onDelete,
  onEdit,
  onViewDetails,
  columnVisibility,
}: InventoryTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteItem = async (item: IInventory) => {
    setIsDeleting(item.product_id);
    try {
      await onDelete(item);
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Status Config - Monochromatic
  const getStatusConfig = (item: IInventory) => {
    const quantity = item.quantity;
    const reorderPoint = item.reorderPoint ?? 0;

    if (quantity === 0) {
      return {
        label: "Out of Stock",
        className: "bg-gray-50 text-gray-800 border-gray-300",
        icon: XCircle,
      };
    }
    if (quantity <= reorderPoint) {
      return {
        label: "Low Stock",
        className: "bg-amber-50 text-amber-800 border-amber-300",
        icon: AlertCircle,
      };
    }
    return {
      label: "In Stock",
      className: "bg-emerald-50 text-emerald-800 border-emerald-300",
      icon: CheckCircle2,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Calculate totals for summary
  const totalValue = items.reduce((sum, item) => {
    const salePrice = item.salePrice ?? 0;
    const totalValue = item.totalValue ?? item.quantity * salePrice;
    return sum + totalValue;
  }, 0);

  const totalStock = items.reduce((sum, item) => sum + item.quantity, 0);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-12">
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-32" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 rounded ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  // --- Empty State ---
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {/* Empty State */}
        <div className="border border-gray-200 rounded-lg bg-white p-12 text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No inventory items found
          </h3>
          <p className="text-gray-600 max-w-sm mx-auto mb-6">
            Your inventory is empty. Add items to start tracking your stock.
          </p>
        </div>
      </div>
    );
  }

  // --- Main Table ---
  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-background">
              <TableRow>
                <TableHead className="w-12 text-gray-700 font-semibold">
                  #
                </TableHead>
                <TableHead className="text-gray-700 font-semibold">
                  Item Details
                </TableHead>
                <TableHead className="text-gray-700 font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">
                  Quantity
                </TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">
                  Unit Cost
                </TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">
                  Sale Price
                </TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">
                  Value
                </TableHead>
                <TableHead className="text-gray-700 font-semibold text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const status = getStatusConfig(item);
                const unitCost = item.unitCost ?? 0;
                const salePrice = item.salePrice ?? 0;
                const totalValue = item.totalValue ?? item.quantity * salePrice;
                const profitMargin =
                  salePrice > 0
                    ? ((salePrice - unitCost) / salePrice) * 100
                    : 0;

                return (
                  <TableRow
                    key={item.product_id}
                    className="hover:bg-gray-50/50"
                  >
                    <TableCell className="font-medium text-gray-900">
                      {index + 1}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-gray-100">
                            <Package className="h-3.5 w-3.5 text-gray-600" />
                          </div>
                          <span className="font-semibold text-sm text-gray-900">
                            {formatText(item.name, 25)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.description && (
                            <div className="truncate max-w-[200px] mb-1">
                              {formatText(item.description, 30)}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {columnVisibility.category && (
                              <Badge
                                variant="outline"
                                className="text-xs border-gray-300 text-gray-700"
                              >
                                {item.category}
                              </Badge>
                            )}
                            {columnVisibility.supplier && item.supplier && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Building className="h-3 w-3" />
                                {formatText(item.supplier, 15)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "flex items-center gap-1.5",
                          status.className
                        )}
                      >
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="space-y-0.5">
                        <div className="text-base font-semibold text-gray-900">
                          {item.quantity.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 uppercase">
                          {item.unit}
                        </div>
                        {columnVisibility.reorderPoint && item.reorderPoint && (
                          <div className="text-xs text-amber-600">
                            Reorder: {item.reorderPoint}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-900">
                          ₱
                          {unitCost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-emerald-700">
                          ₱
                          {salePrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        {salePrice > unitCost && unitCost > 0 && (
                          <div
                            className={cn(
                              "text-xs font-medium",
                              profitMargin >= 30
                                ? "text-emerald-600"
                                : profitMargin >= 20
                                  ? "text-amber-600"
                                  : "text-gray-600"
                            )}
                          >
                            {profitMargin.toFixed(1)}% margin
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="space-y-0.5">
                        <div className="text-base font-semibold text-gray-900">
                          ₱
                          {totalValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            disabled={isDeleting === item.product_id}
                          >
                            <span className="sr-only">Open menu</span>
                            {isDeleting === item.product_id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4 text-gray-600" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs text-gray-600 font-normal">
                            Item Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            className="text-xs cursor-pointer text-gray-700"
                            onClick={() => onViewDetails(item)}
                          >
                            <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                          </DropdownMenuItem>
                          {onEdit && (
                            <DropdownMenuItem
                              className="text-xs cursor-pointer text-gray-700"
                              onClick={() => onEdit(item)}
                            >
                              <Edit className="mr-2 h-3.5 w-3.5" /> Edit Item
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => handleDeleteItem(item)}
                            disabled={isDeleting === item.product_id}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Table Summary */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {items.length} of {items.length} items
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-gray-600">Total Stock:</span>{" "}
                <span className="font-semibold text-gray-900">
                  {totalStock.toLocaleString()} units
                </span>
              </div>
              {columnVisibility.totalValue && (
                <div className="text-sm">
                  <span className="text-gray-600">Total Value:</span>{" "}
                  <span className="font-semibold text-gray-900">
                    ₱
                    {totalValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
