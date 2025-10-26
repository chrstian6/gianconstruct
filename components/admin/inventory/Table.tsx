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

  const getStatusVariant = (item: IInventory) => {
    const quantity = item.quantity;
    const reorderPoint = item.reorderPoint ?? 0;
    const safetyStock = item.safetyStock ?? 0;

    if (quantity === 0) return "destructive";
    if (quantity <= safetyStock) return "destructive";
    if (quantity <= reorderPoint) return "secondary";
    return "default";
  };

  const getStatusText = (item: IInventory) => {
    const quantity = item.quantity;
    const reorderPoint = item.reorderPoint ?? 0;
    const safetyStock = item.safetyStock ?? 0;

    if (quantity === 0) return "Out of Stock";
    if (quantity <= safetyStock) return "Critical";
    if (quantity <= reorderPoint) return "Low Stock";
    return "In Stock";
  };

  if (loading) {
    return (
      <div className="w-full overflow-x-auto rounded-md border-none max-w-full">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="p-3 text-left border border-gray-300 bg-gray-50">
                  Name
                </TableHead>
                <TableHead className="p-3 text-left border border-gray-300 bg-gray-50">
                  Category
                </TableHead>
                <TableHead className="p-3 text-right border border-gray-300 bg-gray-50">
                  Quantity
                </TableHead>
                <TableHead className="p-3 text-right border border-gray-300 bg-gray-50">
                  Unit Cost
                </TableHead>
                <TableHead className="p-3 text-left border border-gray-300 bg-gray-50">
                  Status
                </TableHead>
                <TableHead className="p-3 text-center border border-gray-300 bg-gray-50">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="p-3 border border-gray-300">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell className="p-3 border border-gray-300">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="p-3 border border-gray-300">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="p-3 border border-gray-300">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="p-3 border border-gray-300">
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell className="p-3 border border-gray-300">
                    <Skeleton className="h-8 w-8 mx-auto" />
                  </TableCell>
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
              <TableHead className="p-3 text-left border border-gray-300 ">
                Name
              </TableHead>
              <TableHead className="p-3 text-left border border-gray-300">
                Category
              </TableHead>
              <TableHead className="p-3 text-right border border-gray-300">
                Quantity
              </TableHead>
              <TableHead className="p-3 text-right border border-gray-300">
                Unit Cost
              </TableHead>
              <TableHead className="p-3 text-left border border-gray-300">
                Status
              </TableHead>
              <TableHead className="p-3 text-center border border-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const unitCost = item.unitCost ?? 0;
              const calculatedTotalCost = item.quantity * unitCost;

              return (
                <TableRow key={item.item_id} className="hover:bg-gray-50">
                  <TableCell className="p-3 border border-gray-300">
                    <div className="flex flex-col min-w-0">
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

                  <TableCell className="p-3 border border-gray-300">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </TableCell>

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

                  <TableCell className="p-3 text-right border border-gray-300">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">
                        ₱{unitCost.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-500">
                        ₱{calculatedTotalCost.toLocaleString()} total
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="p-3 border border-gray-300">
                    <Badge variant={getStatusVariant(item)} className="text-xs">
                      {getStatusText(item)}
                    </Badge>
                  </TableCell>

                  <TableCell className="p-3 text-center border border-gray-300">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={isDeleting === item.item_id}
                        >
                          <span className="sr-only">Open menu</span>
                          {isDeleting === item.item_id ? (
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
