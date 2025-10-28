// components/admin/inventory/Table.tsx
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Trash2, Edit, Eye, Package } from "lucide-react";
import { useState } from "react";

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

  const getStatusVariant = (item: IInventory) => {
    const quantity = item.quantity;
    const reorderPoint = item.reorderPoint ?? 0;

    if (quantity === 0) return "destructive";
    if (quantity <= reorderPoint) return "secondary";
    return "default";
  };

  const getStatusText = (item: IInventory) => {
    const quantity = item.quantity;
    const reorderPoint = item.reorderPoint ?? 0;

    if (quantity === 0) return "Out of Stock";
    if (quantity <= reorderPoint) return "Low Stock";
    return "In Stock";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Essential columns that should always be visible
  const essentialColumns = [
    { key: "name", label: "Product Name", visible: true, align: "left" },
    { key: "quantity", label: "Quantity", visible: true, align: "right" },
    { key: "unitCost", label: "Base Price", visible: true, align: "right" },
  ];

  // Optional columns based on visibility settings
  const optionalColumns = [
    {
      key: "category",
      label: "Category",
      visible: columnVisibility.category,
      align: "left",
    },
    {
      key: "salePrice",
      label: "Sale Price",
      visible: columnVisibility.salePrice,
      align: "right",
    },
    {
      key: "totalCapital",
      label: "Total Capital",
      visible: columnVisibility.totalCapital,
      align: "right",
    },
    {
      key: "totalValue",
      label: "Total Value",
      visible: columnVisibility.totalValue,
      align: "right",
    },
  ];

  // End columns - Status, Date, Actions
  const endColumns = [
    {
      key: "status",
      label: "Status",
      visible: columnVisibility.status,
      align: "left",
    },
    { key: "date", label: "Date Added", visible: true, align: "left" },
    { key: "actions", label: "Actions", visible: true, align: "center" },
  ];

  // Product ID at the start (if visible)
  const productIdColumn = [
    {
      key: "id",
      label: "Product ID",
      visible: columnVisibility.id,
      align: "left",
    },
  ];

  const allColumns = [
    ...productIdColumn,
    ...essentialColumns,
    ...optionalColumns,
    ...endColumns,
  ];

  if (loading) {
    return (
      <div className="w-full overflow-x-auto rounded-md border-none max-w-full">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              <TableRow>
                {allColumns.map(
                  (column) =>
                    column.visible && (
                      <TableHead
                        key={column.key}
                        className={`p-3 border border-gray-300 bg-gray-50 ${
                          column.align === "right"
                            ? "text-right"
                            : column.align === "center"
                              ? "text-center"
                              : "text-left"
                        }`}
                      >
                        {column.label}
                      </TableHead>
                    )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {allColumns.map(
                    (column) =>
                      column.visible && (
                        <TableCell
                          key={column.key}
                          className={`p-3 border border-gray-300 ${
                            column.align === "right"
                              ? "text-right"
                              : column.align === "center"
                                ? "text-center"
                                : "text-left"
                          }`}
                        >
                          {column.key === "actions" ? (
                            <Skeleton className="h-8 w-8 mx-auto" />
                          ) : column.key === "status" ? (
                            <Skeleton className="h-6 w-20" />
                          ) : column.key === "date" ? (
                            <Skeleton className="h-4 w-20" />
                          ) : column.key === "id" ? (
                            <Skeleton className="h-4 w-24" />
                          ) : column.key === "name" ? (
                            <Skeleton className="h-4 w-32" />
                          ) : column.key === "quantity" ? (
                            <Skeleton className="h-4 w-16 ml-auto" />
                          ) : column.key === "unitCost" ? (
                            <Skeleton className="h-4 w-20 ml-auto" />
                          ) : column.key === "category" ? (
                            <Skeleton className="h-4 w-20" />
                          ) : (
                            <Skeleton className="h-4 w-20 ml-auto" />
                          )}
                        </TableCell>
                      )
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-10 py-16 text-center border border-gray-300 rounded-md">
        <div className="text-muted-foreground mb-4">
          <Package className="h-12 w-12 text-gray-400 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No inventory items found
        </h3>
        <p className="text-sm text-muted-foreground">
          Get started by adding your first inventory item.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto max-w-full">
      <div className="min-w-max">
        <Table className="w-full border-0">
          <TableHeader>
            <TableRow>
              {allColumns.map(
                (column) =>
                  column.visible && (
                    <TableHead
                      key={column.key}
                      className={`p-3 border border-gray-300 bg-gray-50 ${
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                            ? "text-center"
                            : "text-left"
                      }`}
                    >
                      {column.label}
                    </TableHead>
                  )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const unitCost = item.unitCost ?? 0;
              const salePrice = item.salePrice ?? 0;
              const totalCapital =
                item.totalCapital ?? item.quantity * unitCost;
              const totalValue = item.totalValue ?? item.quantity * salePrice;

              return (
                <TableRow key={item.product_id} className="hover:bg-gray-50">
                  {/* Product ID at the start */}
                  {columnVisibility.id && (
                    <TableCell className="p-3 border border-gray-300">
                      <code className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        {item.product_id}
                      </code>
                    </TableCell>
                  )}

                  {/* Essential Columns */}

                  {/* Product Name */}
                  <TableCell className="p-3 border border-gray-300">
                    <div className="flex flex-col min-w-0 max-w-[200px]">
                      <span className="font-medium text-sm truncate">
                        {item.name}
                      </span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Quantity */}
                  <TableCell className="p-3 text-right border border-gray-300">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">
                        {item.quantity.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-500 uppercase">
                        {item.unit}
                      </span>
                    </div>
                  </TableCell>

                  {/* Base Price */}
                  <TableCell className="p-3 text-right border border-gray-300">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">
                        ₱
                        {unitCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-xs text-muted-500">
                        per {item.unit}
                      </span>
                    </div>
                  </TableCell>

                  {/* Optional Columns */}

                  {/* Category */}
                  {columnVisibility.category && (
                    <TableCell className="p-3 border border-gray-300">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </TableCell>
                  )}

                  {/* Sale Price */}
                  {columnVisibility.salePrice && (
                    <TableCell className="p-3 text-right border border-gray-300">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">
                          ₱
                          {salePrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-xs text-muted-500">
                          per {item.unit}
                        </span>
                      </div>
                    </TableCell>
                  )}

                  {/* Total Capital */}
                  {columnVisibility.totalCapital && (
                    <TableCell className="p-3 text-right border border-gray-300">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-green-700">
                          ₱
                          {totalCapital.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-xs text-muted-500">capital</span>
                      </div>
                    </TableCell>
                  )}

                  {/* Total Value */}
                  {columnVisibility.totalValue && (
                    <TableCell className="p-3 text-right border border-gray-300">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-blue-700">
                          ₱
                          {totalValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-xs text-muted-500">value</span>
                      </div>
                    </TableCell>
                  )}

                  {/* End Columns */}

                  {/* Status */}
                  {columnVisibility.status && (
                    <TableCell className="p-3 border border-gray-300">
                      <Badge
                        variant={getStatusVariant(item)}
                        className="text-xs"
                      >
                        {getStatusText(item)}
                      </Badge>
                    </TableCell>
                  )}

                  {/* Date Added */}
                  <TableCell className="p-3 border border-gray-300">
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {formatDate(item.timeCreated)}
                      </span>
                      <span className="text-xs text-muted-500">
                        {new Date(item.timeCreated).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="p-3 text-center border border-gray-300">
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
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onViewDetails(item)}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        {onEdit && (
                          <DropdownMenuItem
                            onClick={() => onEdit(item)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit item
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteItem(item)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                          disabled={isDeleting === item.product_id}
                        >
                          {isDeleting === item.product_id ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete item
                            </>
                          )}
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
