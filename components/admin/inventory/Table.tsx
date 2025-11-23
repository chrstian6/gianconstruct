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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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

  // Modern Status Config
  const getStatusConfig = (item: IInventory) => {
    const quantity = item.quantity;
    const reorderPoint = item.reorderPoint ?? 0;

    if (quantity === 0) {
      return {
        label: "Out of Stock",
        className: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
      };
    }
    if (quantity <= reorderPoint) {
      return {
        label: "Low Stock",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        icon: AlertCircle,
      };
    }
    return {
      label: "In Stock",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
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

  // Column Definitions
  const allColumns = [
    { key: "id", label: "ID", visible: columnVisibility.id, align: "left" },
    { key: "name", label: "Product Details", visible: true, align: "left" },
    {
      key: "category",
      label: "Category",
      visible: columnVisibility.category,
      align: "left",
    },
    {
      key: "status",
      label: "Status",
      visible: columnVisibility.status,
      align: "left",
    },
    { key: "quantity", label: "Qty", visible: true, align: "right" },
    { key: "unitCost", label: "Base Price", visible: true, align: "right" },
    {
      key: "salePrice",
      label: "Sale Price",
      visible: columnVisibility.salePrice,
      align: "right",
    },
    {
      key: "totalCapital",
      label: "Capital",
      visible: columnVisibility.totalCapital,
      align: "right",
    },
    {
      key: "totalValue",
      label: "Value",
      visible: columnVisibility.totalValue,
      align: "right",
    },
    { key: "date", label: "Date Added", visible: true, align: "right" },
    { key: "actions", label: "", visible: true, align: "center" },
  ];

  // --- Loading State ---
  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              {allColumns.map(
                (col) =>
                  col.visible && (
                    <TableHead
                      key={col.key}
                      className={cn(
                        "h-10",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center"
                      )}
                    >
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                  )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {allColumns.map(
                  (col) =>
                    col.visible && (
                      <TableCell key={col.key} className="py-3">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // --- Empty State ---
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 flex flex-col items-center justify-center py-24 text-center">
        <div className="h-12 w-12 bg-white rounded-full border border-zinc-200 flex items-center justify-center mb-4">
          <Package className="h-6 w-6 text-zinc-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900">
          No inventory found
        </h3>
        <p className="text-sm text-zinc-500 mt-1 max-w-xs">
          Your inventory is empty. Add items to start tracking your stock.
        </p>
      </div>
    );
  }

  // --- Main Table ---
  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50/50 border-b border-zinc-200">
            <TableRow className="hover:bg-transparent border-none">
              {allColumns.map(
                (column) =>
                  column.visible && (
                    <TableHead
                      key={column.key}
                      className={cn(
                        "h-11 text-xs font-medium uppercase tracking-wider text-zinc-500",
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                            ? "text-center"
                            : "text-left"
                      )}
                    >
                      {column.label}
                    </TableHead>
                  )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const status = getStatusConfig(item);
              const unitCost = item.unitCost ?? 0;
              const salePrice = item.salePrice ?? 0;
              const totalCapital =
                item.totalCapital ?? item.quantity * unitCost;
              const totalValue = item.totalValue ?? item.quantity * salePrice;

              return (
                <TableRow
                  key={item.product_id}
                  className="group hover:bg-zinc-50/50 border-b border-zinc-100 last:border-none transition-colors"
                >
                  {/* ID */}
                  {columnVisibility.id && (
                    <TableCell className="py-3">
                      <span className="font-mono text-xs text-zinc-500">
                        {item.product_id.substring(0, 8)}...
                      </span>
                    </TableCell>
                  )}

                  {/* Product Name */}
                  <TableCell className="py-3 max-w-[250px]">
                    <div className="flex flex-col">
                      <span
                        className="font-medium text-sm text-zinc-900 truncate block"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      {item.description && (
                        <span
                          className="text-xs text-zinc-500 truncate block mt-0.5"
                          title={item.description}
                        >
                          {item.description}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}
                  {columnVisibility.category && (
                    <TableCell className="py-3">
                      <Badge
                        variant="secondary"
                        className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border-zinc-200 rounded-md font-normal"
                      >
                        {item.category}
                      </Badge>
                    </TableCell>
                  )}

                  {/* Status */}
                  {columnVisibility.status && (
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium flex w-fit items-center gap-1 pr-2.5",
                          status.className
                        )}
                      >
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                  )}

                  {/* Quantity */}
                  <TableCell className="py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-sm text-zinc-900 font-mono">
                        {item.quantity.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wide">
                        {item.unit}
                      </span>
                    </div>
                  </TableCell>

                  {/* Base Price */}
                  <TableCell className="py-3 text-right">
                    <div className="font-mono text-sm text-zinc-700">
                      <span className="text-zinc-400 mr-0.5">₱</span>
                      {unitCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </TableCell>

                  {/* Sale Price */}
                  {columnVisibility.salePrice && (
                    <TableCell className="py-3 text-right">
                      <div className="font-mono text-sm text-zinc-700">
                        <span className="text-zinc-400 mr-0.5">₱</span>
                        {salePrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </TableCell>
                  )}

                  {/* Total Capital */}
                  {columnVisibility.totalCapital && (
                    <TableCell className="py-3 text-right">
                      <div className="font-mono text-sm text-zinc-900 font-medium">
                        <span className="text-zinc-400 mr-0.5">₱</span>
                        {totalCapital.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </TableCell>
                  )}

                  {/* Total Value */}
                  {columnVisibility.totalValue && (
                    <TableCell className="py-3 text-right">
                      <div className="font-mono text-sm text-zinc-900 font-medium">
                        <span className="text-zinc-400 mr-0.5">₱</span>
                        {totalValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </TableCell>
                  )}

                  {/* Date */}
                  <TableCell className="py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-zinc-600">
                        {formatDate(item.timeCreated)}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(item.timeCreated).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                          disabled={isDeleting === item.product_id}
                        >
                          <span className="sr-only">Open menu</span>
                          {isDeleting === item.product_id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-40 font-geist"
                      >
                        <DropdownMenuLabel className="text-xs text-zinc-500 font-normal">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewDetails(item)}>
                          <Eye className="mr-2 h-3.5 w-3.5" /> View
                        </DropdownMenuItem>
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteItem(item)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
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
    </div>
  );
}
