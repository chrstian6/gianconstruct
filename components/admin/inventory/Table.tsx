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
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  MapPin,
  Clock,
  Truck,
  Package,
  DollarSign,
  Hash,
  FileText,
  Tag,
  AlertTriangle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, Fragment } from "react";

interface InventoryTableProps {
  items: IInventory[];
  loading: boolean;
  onDelete: (item: IInventory) => void;
  onEdit?: (item: IInventory) => void;
  onViewDetails?: (item: IInventory) => void;
  columnVisibility: {
    id: boolean;
    sku: boolean;
    name: boolean;
    category: boolean;
    quantity: boolean;
    unit: boolean;
    unitCost: boolean;
    totalCost: boolean;
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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteItem = async (item: IInventory) => {
    setIsDeleting(item.item_id);
    try {
      await onDelete(item);
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
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

  const toggleRowExpansion = (itemId: string) => {
    setExpandedRow(expandedRow === itemId ? null : itemId);
  };

  if (loading) {
    return (
      <div className="w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columnVisibility.id && (
                <TableHead className="px-4 text-left min-w-[60px]">
                  ID
                </TableHead>
              )}
              {columnVisibility.sku && (
                <TableHead className="px-4 text-left min-w-[80px]">
                  SKU
                </TableHead>
              )}
              {columnVisibility.name && (
                <TableHead className="px-4 text-left min-w-[100px]">
                  Name
                </TableHead>
              )}
              {columnVisibility.category && (
                <TableHead className="px-4 text-left min-w-[80px]">
                  Category
                </TableHead>
              )}
              {columnVisibility.quantity && (
                <TableHead className="px-4 text-right min-w-[60px]">
                  Qty
                </TableHead>
              )}
              {columnVisibility.unit && (
                <TableHead className="px-4 text-left min-w-[60px]">
                  Unit
                </TableHead>
              )}
              {columnVisibility.unitCost && (
                <TableHead className="px-4 text-right min-w-[80px]">
                  Cost
                </TableHead>
              )}
              {columnVisibility.totalCost && (
                <TableHead className="px-4 text-right min-w-[80px]">
                  Total
                </TableHead>
              )}
              {columnVisibility.location && (
                <TableHead className="px-4 text-left min-w-[100px]">
                  Location
                </TableHead>
              )}
              {columnVisibility.supplier && (
                <TableHead className="px-4 text-left min-w-[100px]">
                  Supplier
                </TableHead>
              )}
              {columnVisibility.reorderPoint && (
                <TableHead className="px-4 text-right min-w-[80px]">
                  Reorder
                </TableHead>
              )}
              {columnVisibility.status && (
                <TableHead className="px-4 text-left min-w-[80px]">
                  Status
                </TableHead>
              )}
              {columnVisibility.actions && (
                <TableHead className="px-4 text-right min-w-[80px]">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {Object.values(columnVisibility)
                  .filter((visible) => visible)
                  .map((_, cellIndex) => (
                    <TableCell key={cellIndex} className="px-4 py-4">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md">
        <div className="text-muted-foreground mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
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
    <div className="w-full rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columnVisibility.id && (
              <TableHead className="px-4 text-left min-w-[60px]">ID</TableHead>
            )}
            {columnVisibility.sku && (
              <TableHead className="px-4 text-left min-w-[80px]">SKU</TableHead>
            )}
            {columnVisibility.name && (
              <TableHead className="px-4 text-left min-w-[100px]">
                Name
              </TableHead>
            )}
            {columnVisibility.category && (
              <TableHead className="px-4 text-left min-w-[80px]">
                Category
              </TableHead>
            )}
            {columnVisibility.quantity && (
              <TableHead className="px-4 text-right min-w-[60px]">
                Qty
              </TableHead>
            )}
            {columnVisibility.unit && (
              <TableHead className="px-4 text-left min-w-[60px]">
                Unit
              </TableHead>
            )}
            {columnVisibility.unitCost && (
              <TableHead className="px-4 text-right min-w-[80px]">
                Cost
              </TableHead>
            )}
            {columnVisibility.totalCost && (
              <TableHead className="px-4 text-right min-w-[80px]">
                Total
              </TableHead>
            )}
            {columnVisibility.location && (
              <TableHead className="px-4 text-left min-w-[100px]">
                Location
              </TableHead>
            )}
            {columnVisibility.supplier && (
              <TableHead className="px-4 text-left min-w-[100px]">
                Supplier
              </TableHead>
            )}
            {columnVisibility.reorderPoint && (
              <TableHead className="px-4 text-right min-w-[80px]">
                Reorder
              </TableHead>
            )}
            {columnVisibility.status && (
              <TableHead className="px-4 text-left min-w-[80px]">
                Status
              </TableHead>
            )}
            {columnVisibility.actions && (
              <TableHead className="px-4 text-right min-w-[80px]">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const unitCost = item.unitCost ?? 0;
            const calculatedTotalCost = item.quantity * unitCost;
            const reorderPoint = item.reorderPoint ?? 0;
            const safetyStock = item.safetyStock ?? 0;
            const isLowStock = item.quantity <= reorderPoint;
            const isOutOfStock = item.quantity === 0;
            const isVeryLowStock = isLowStock && item.quantity <= safetyStock;
            const isExpanded = expandedRow === item.item_id;

            const getStatusVariant = () => {
              if (isOutOfStock) return "destructive";
              if (isVeryLowStock) return "destructive";
              if (isLowStock) return "secondary";
              return "default";
            };

            const getStatusText = () => {
              if (isOutOfStock) return "Out of Stock";
              if (isVeryLowStock) return "Critical";
              if (isLowStock) return "Low Stock";
              return "In Stock";
            };

            return (
              <Fragment key={item.item_id}>
                <TableRow
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleRowExpansion(item.item_id)}
                >
                  {columnVisibility.id && (
                    <TableCell className="px-4 py-4 font-mono text-xs text-left">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate max-w-[60px] block">
                              {item.item_id}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>ID: {item.item_id}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  )}

                  {columnVisibility.sku && (
                    <TableCell className="px-4 py-4 font-mono text-xs text-left">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate max-w-[80px] block">
                              {item.sku}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>SKU: {item.sku}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  )}

                  {columnVisibility.name && (
                    <TableCell className="px-4 py-4 min-w-[100px] text-left">
                      <div className="flex flex-col">
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
                  )}

                  {columnVisibility.category && (
                    <TableCell className="px-4 py-4 text-left">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </TableCell>
                  )}

                  {columnVisibility.quantity && (
                    <TableCell className="px-4 py-4 text-right font-medium">
                      <div className="flex flex-col items-end">
                        <span>{item.quantity.toLocaleString()}</span>
                        {isLowStock && (
                          <span className="text-xs text-muted-foreground">
                            {item.quantity <= safetyStock ? "⚠️" : "📉"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {columnVisibility.unit && (
                    <TableCell className="px-4 py-4 text-sm uppercase text-left">
                      {item.unit}
                    </TableCell>
                  )}

                  {columnVisibility.unitCost && (
                    <TableCell className="px-4 py-4 text-right">
                      ₱{unitCost.toLocaleString()}
                    </TableCell>
                  )}

                  {columnVisibility.totalCost && (
                    <TableCell className="px-4 py-4 text-right font-medium">
                      ₱{calculatedTotalCost.toLocaleString()}
                    </TableCell>
                  )}

                  {columnVisibility.location && (
                    <TableCell className="px-4 py-4 text-left">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[100px]">
                                {item.location || "N/A"}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Location: {item.location || "Not specified"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  )}

                  {columnVisibility.supplier && (
                    <TableCell className="px-4 py-4 text-left">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <Truck className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[100px]">
                                {item.supplier || "N/A"}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supplier: {item.supplier || "Not specified"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  )}

                  {columnVisibility.reorderPoint && (
                    <TableCell className="px-4 py-4 text-right text-sm">
                      {reorderPoint.toLocaleString()}
                    </TableCell>
                  )}

                  {columnVisibility.status && (
                    <TableCell className="px-4 py-4 text-left">
                      <Badge variant={getStatusVariant()} className="text-xs">
                        {getStatusText()}
                      </Badge>
                    </TableCell>
                  )}

                  {columnVisibility.actions && (
                    <TableCell className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => e.stopPropagation()}
                            disabled={isDeleting === item.item_id}
                          >
                            <span className="sr-only">Open menu</span>
                            {isDeleting === item.item_id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {onViewDetails && (
                            <DropdownMenuItem
                              onClick={() => onViewDetails(item)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                          )}
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
                            disabled={isDeleting === item.item_id}
                          >
                            {isDeleting === item.item_id ? (
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
                  )}
                </TableRow>

                {isExpanded && (
                  <TableRow className="bg-muted/50">
                    <TableCell
                      colSpan={
                        Object.values(columnVisibility).filter(
                          (visible) => visible
                        ).length
                      }
                      className="px-4 py-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>
                            <p className="text-muted-foreground">
                              {formatDateTime(item.timeCreated)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <span className="font-medium">Last Updated:</span>
                            <p className="text-muted-foreground">
                              {formatDateTime(item.timeUpdated)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Safety Stock:</span>
                          <p className="text-muted-foreground">
                            {safetyStock.toLocaleString()}
                          </p>
                        </div>
                        {item.supplier && (
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                              <Truck className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <span className="font-medium">Supplier:</span>
                              <p className="text-muted-foreground">
                                {item.supplier}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
