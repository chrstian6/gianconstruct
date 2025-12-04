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

  const formatText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Define table headers with visibility control
  const tableHeaders = [
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
    { key: "actions", label: "Actions", visible: true, align: "center" },
  ].filter((header) => header.visible);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto">
          <Table className="min-w-full compact-table">
            <TableHeader className="bg-muted/50">
              <TableRow className="h-10">
                {tableHeaders.map((header) => (
                  <TableHead
                    key={header.key}
                    className={cn(
                      "px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider",
                      header.align === "right" && "text-right",
                      header.align === "center" && "text-center"
                    )}
                  >
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="h-12">
                  {tableHeaders.map((header) => (
                    <TableCell key={header.key} className="px-3 py-2">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // --- Empty State ---
  if (items.length === 0) {
    return (
      <div className="w-full rounded-lg border border-dashed border-border bg-muted/50 flex flex-col items-center justify-center py-24 text-center">
        <div className="h-12 w-12 bg-card rounded-full border border-border flex items-center justify-center mb-4">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          No inventory found
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Your inventory is empty. Add items to start tracking your stock.
        </p>
      </div>
    );
  }

  // --- Main Table ---
  return (
    <div className="w-full">
      <div className="overflow-x-auto max-w-5xl mx-auto">
        <Table className="min-w-full compact-table">
          <TableHeader className="bg-muted/50">
            <TableRow className="h-10">
              {tableHeaders.map((header) => (
                <TableHead
                  key={header.key}
                  className={cn(
                    "px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider",
                    header.align === "right" && "text-right",
                    header.align === "center" && "text-center"
                  )}
                >
                  {header.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card divide-y divide-border">
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
                  className="h-12 hover:bg-accent/50 transition-colors"
                >
                  {/* ID */}
                  {columnVisibility.id && (
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground font-mono">
                      {formatText(item.product_id, 8)}
                    </TableCell>
                  )}

                  {/* Product Name */}
                  <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground">
                    <div className="flex flex-col">
                      <span
                        className="font-medium text-foreground truncate"
                        title={item.name}
                      >
                        {formatText(item.name, 25)}
                      </span>
                      {item.description && (
                        <span
                          className="text-muted-foreground truncate mt-0.5"
                          title={item.description}
                        >
                          {formatText(item.description, 30)}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}
                  {columnVisibility.category && (
                    <TableCell className="px-3 py-2 whitespace-nowrap">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {item.category}
                      </Badge>
                    </TableCell>
                  )}

                  {/* Status */}
                  {columnVisibility.status && (
                    <TableCell className="px-3 py-2 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium flex w-fit items-center gap-1 pr-2.5",
                          status.className
                        )}
                      >
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                  )}

                  {/* Quantity */}
                  <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-foreground font-mono">
                        {item.quantity.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground uppercase tracking-wide">
                        {item.unit}
                      </span>
                    </div>
                  </TableCell>

                  {/* Base Price */}
                  <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground text-right">
                    <div className="font-mono text-foreground">
                      <span className="text-muted-foreground mr-0.5">₱</span>
                      {unitCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </TableCell>

                  {/* Sale Price */}
                  {columnVisibility.salePrice && (
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground text-right">
                      <div className="font-mono text-foreground">
                        <span className="text-muted-foreground mr-0.5">₱</span>
                        {salePrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </TableCell>
                  )}

                  {/* Total Capital */}
                  {columnVisibility.totalCapital && (
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground text-right">
                      <div className="font-mono text-foreground font-medium">
                        <span className="text-muted-foreground mr-0.5">₱</span>
                        {totalCapital.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </TableCell>
                  )}

                  {/* Total Value */}
                  {columnVisibility.totalValue && (
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground text-right">
                      <div className="font-mono text-foreground font-medium">
                        <span className="text-muted-foreground mr-0.5">₱</span>
                        {totalValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </TableCell>
                  )}

                  {/* Date */}
                  <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-foreground">
                        {formatDate(item.timeCreated)}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(item.timeCreated).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={isDeleting === item.product_id}
                        >
                          <span className="sr-only">Open menu</span>
                          {isDeleting === item.product_id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          className="text-xs cursor-pointer"
                          onClick={() => onViewDetails(item)}
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                        </DropdownMenuItem>
                        {onEdit && (
                          <DropdownMenuItem
                            className="text-xs cursor-pointer"
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
    </div>
  );
}
