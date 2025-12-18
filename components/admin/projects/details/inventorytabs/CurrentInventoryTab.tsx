// components/projects/inventorytabs/CurrentInventoryTab.tsx
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Box,
  Eye,
  Filter,
  ArrowUpDown,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  Minus,
  Loader2,
  Hammer,
  MoreVertical,
  Tag,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { IInventory } from "@/types/Inventory";
import { ProjectInventoryRecord } from "@/types/project-inventory";
import { createProjectInventory } from "@/action/project-inventory";
import { CurrentInventoryItem as ServerCurrentInventoryItem } from "@/types/project-inventory";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CurrentInventoryTabProps {
  currentInventory: LocalCurrentInventoryItem[];
  inventoryItems: Map<string, IInventory>;
  records: ProjectInventoryRecord[];
  setViewDetails: (record: ProjectInventoryRecord) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  projectId: string;
  refreshData: () => Promise<void>;
  user: {
    user_id: string;
    name: string;
    role: string;
  };
}

// Local interface that matches what's being passed from ProjectInventoryTab
interface LocalCurrentInventoryItem {
  product_id: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
  totalTransferredIn: number;
  totalReturnedOut: number;
  totalAdjusted?: number;
  action: string;
  unitCost: number;
  totalCost: number;
  salePrice?: number;
  totalValue?: number;
  supplier: string;
  location?: string;
  projectReorderPoint?: number | null; // Allow null to match ServerCurrentInventoryItem
  isLowStock: boolean;
  profitMargin?: number;
  lastTransaction?: string;
  lastProjectInventoryId?: string;
  totalCheckedOut?: number;
  totalReturned?: number;
}

type ActionType = "checkout" | "return" | "use";

export default function CurrentInventoryTab({
  currentInventory,
  inventoryItems,
  records,
  setViewDetails,
  formatCurrency,
  formatDate,
  formatTime,
  projectId,
  refreshData,
  user,
}: CurrentInventoryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "quantity" | "name" | "cost" | "transferred" | "lowstock"
  >("quantity");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: ActionType;
    item: LocalCurrentInventoryItem | null;
  }>({ open: false, type: "checkout", item: null });
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Debug: Log the current inventory data
  useEffect(() => {
    console.log("📋 CurrentInventoryTab - Inventory Data:", {
      totalItems: currentInventory.length,
      items: currentInventory.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        currentQuantity: item.currentQuantity,
        projectReorderPoint: item.projectReorderPoint,
        hasProjectReorder:
          item.projectReorderPoint !== undefined &&
          item.projectReorderPoint !== null,
        isLowStock: item.isLowStock,
      })),
    });
  }, [currentInventory]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, sortBy]);

  const getCategories = () => {
    const categories = new Set<string>();
    currentInventory.forEach((item) => {
      if (item.category) {
        categories.add(item.category);
      }
    });
    return Array.from(categories).sort();
  };

  // Helper function to get unit price safely
  const getUnitPrice = (item: LocalCurrentInventoryItem): number => {
    return item.salePrice && item.salePrice > 0
      ? item.salePrice
      : item.unitCost;
  };

  // Helper function to check if salePrice exists and is valid
  const hasValidSalePrice = (item: LocalCurrentInventoryItem): boolean => {
    return item.salePrice !== undefined && item.salePrice > 0;
  };

  // Get main inventory item for stock checking
  const getMainInventoryItem = (product_id: string): IInventory | null => {
    return inventoryItems.get(product_id) || null;
  };

  // Check if item is low stock based on PROJECT reorder point ONLY
  const isProjectLowStock = (item: LocalCurrentInventoryItem): boolean => {
    // Only check low stock if project reorder point is set
    return item.projectReorderPoint !== undefined &&
      item.projectReorderPoint !== null
      ? item.currentQuantity <= item.projectReorderPoint
      : false;
  };

  // Open action dialog
  const openActionDialog = (
    type: ActionType,
    item: LocalCurrentInventoryItem
  ) => {
    setActionDialog({ open: true, type, item });
    setQuantity(1);
    setNotes("");
  };

  // Calculate max quantity for checkout, return, and use
  const getMaxQuantity = (
    item: LocalCurrentInventoryItem,
    type: ActionType
  ) => {
    if (type === "checkout") {
      const mainItem = getMainInventoryItem(item.product_id);
      return mainItem?.quantity || 0;
    } else if (type === "return" || type === "use") {
      return item.currentQuantity;
    }
    return 0;
  };

  // Handle action submission - FIXED: Properly include projectReorderPoint
  const handleActionSubmit = async () => {
    if (!actionDialog.item) return;

    console.log("🚀 === DEBUG: Submitting action ===");
    console.log("Action type:", actionDialog.type);
    console.log("Item details:", {
      name: actionDialog.item.name,
      product_id: actionDialog.item.product_id,
      currentQuantity: actionDialog.item.currentQuantity,
      projectReorderPoint: actionDialog.item.projectReorderPoint,
      hasProjectReorder:
        actionDialog.item.projectReorderPoint !== undefined &&
        actionDialog.item.projectReorderPoint !== null,
      unit: actionDialog.item.unit,
    });

    const { type, item } = actionDialog;
    const mainInventoryItem = getMainInventoryItem(item.product_id);

    // Validation
    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    // Validate based on action type
    if (type === "checkout") {
      if (!mainInventoryItem) {
        toast.error("Inventory item not found in main inventory");
        return;
      }
      if (mainInventoryItem.quantity < quantity) {
        toast.error(
          `Insufficient stock in main inventory. Only ${mainInventoryItem.quantity} items available`
        );
        return;
      }
    } else if (type === "return" || type === "use") {
      if (item.currentQuantity < quantity) {
        toast.error(
          `Cannot ${type === "return" ? "return" : "use"} more than available in project. Only ${item.currentQuantity} items available`
        );
        return;
      }
    }

    setLoading(true);
    setProcessingItemId(item.product_id);

    try {
      let action: "checked_out" | "returned" | "adjusted" = "adjusted";
      let message = "";

      // Determine action type and message
      if (type === "checkout") {
        action = "checked_out";
        message = `${quantity} ${item.unit} of ${item.name} checked out to project`;
      } else if (type === "return") {
        action = "returned";
        message = `${quantity} ${item.unit} of ${item.name} returned to main inventory`;
      } else if (type === "use") {
        action = "adjusted";
        message = `${quantity} ${item.unit} of ${item.name} used in construction`;
      }

      console.log("📤 Preparing to send to server:", {
        type,
        action,
        quantity,
        item: item.product_id,
        currentQuantity: item.currentQuantity,
        projectReorderPoint: item.projectReorderPoint,
        hasReorderPoint:
          item.projectReorderPoint !== undefined &&
          item.projectReorderPoint !== null,
      });

      // Prepare data for checkout - CRITICAL FIX: Always include projectReorderPoint if item has one
      const inventoryData: any = {
        project_id: projectId,
        product_id: item.product_id,
        quantity,
        unit: item.unit,
        notes: notes.trim() || undefined,
        action: action,
        action_by: {
          user_id: user.user_id,
          name: user.name,
          role: user.role,
        },
      };

      // 🚨 CRITICAL FIX: Always include projectReorderPoint when item has it
      // This ensures the reorder point persists with future checkouts
      if (item.projectReorderPoint !== undefined) {
        inventoryData.projectReorderPoint = item.projectReorderPoint;
        console.log(
          "✅ INCLUDING projectReorderPoint in data:",
          item.projectReorderPoint
        );
      } else {
        console.log("ℹ️ No projectReorderPoint to include for this item");
      }

      console.log("📤 Final data being sent to server:", inventoryData);

      const result = await createProjectInventory(inventoryData);

      if (result.success) {
        toast.success(message);
        setActionDialog({ open: false, type: "checkout", item: null });

        // Force a small delay before refreshing to ensure backend has processed
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log("🔄 Refreshing data after action...");
        await refreshData();
      } else {
        toast.error(result.error || "Failed to process action");
      }
    } catch (error) {
      console.error("❌ Error processing action:", error);
      toast.error("Failed to process action");
    } finally {
      setLoading(false);
      setProcessingItemId(null);
    }
  };

  // Get item status based on PROJECT reorder point ONLY
  const getItemStatus = (item: LocalCurrentInventoryItem) => {
    const hasProjectReorder =
      item.projectReorderPoint !== undefined &&
      item.projectReorderPoint !== null;
    const isLowStock = hasProjectReorder
      ? item.currentQuantity <= item.projectReorderPoint!
      : false;

    if (item.currentQuantity === 0) return "Out of Stock";
    if (isLowStock) return "Low Stock";
    if (!hasProjectReorder) return "Normal (No Alert)";
    return "In Stock";
  };

  // Get status badge color based on PROJECT reorder point
  const getStatusBadgeVariant = (item: LocalCurrentInventoryItem) => {
    const hasProjectReorder =
      item.projectReorderPoint !== undefined &&
      item.projectReorderPoint !== null;
    const isLowStock = hasProjectReorder
      ? item.currentQuantity <= item.projectReorderPoint!
      : false;

    if (item.currentQuantity === 0) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (isLowStock) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (!hasProjectReorder) {
      return "bg-zinc-50 text-zinc-700 border-zinc-200";
    }
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  // Calculate financial impact for dialog
  const calculateFinancialImpact = (
    item: LocalCurrentInventoryItem,
    type: ActionType,
    qty: number
  ) => {
    const unitPrice = getUnitPrice(item);
    const totalAmount = qty * unitPrice;

    if (type === "checkout") {
      return {
        label: "Added to Project",
        amount: totalAmount,
        color: "text-emerald-600",
      };
    } else if (type === "return") {
      return {
        label: "Subtracted from Project",
        amount: totalAmount,
        color: "text-blue-600",
      };
    }
    return null;
  };

  // Filter and sort inventory
  const filteredCurrentInventory = React.useMemo(() => {
    return currentInventory
      .filter((item) => {
        const matchesSearch =
          searchQuery === "" ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.product_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          categoryFilter === "all" || item.category === categoryFilter;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "cost":
            return b.totalCost - a.totalCost;
          case "transferred":
            return b.totalTransferredIn - a.totalTransferredIn;
          case "lowstock":
            // Sort by low stock status first, then quantity
            const aLowStock = isProjectLowStock(a);
            const bLowStock = isProjectLowStock(b);
            if (aLowStock && !bLowStock) return -1;
            if (!aLowStock && bLowStock) return 1;
            return a.currentQuantity - b.currentQuantity;
          case "quantity":
          default:
            return b.currentQuantity - a.currentQuantity;
        }
      });
  }, [currentInventory, searchQuery, categoryFilter, sortBy]);

  // Pagination calculations
  const totalItems = filteredCurrentInventory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedInventory = filteredCurrentInventory.slice(
    startIndex,
    endIndex
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Calculate totals for display (based on filtered inventory, not paginated)
  const calculateTotals = () => {
    const totals = {
      totalQuantity: 0,
      totalValue: 0,
      totalCost: 0,
      totalItems: filteredCurrentInventory.length,
      lowStockItems: 0,
      itemsWithProjectReorder: 0,
    };

    filteredCurrentInventory.forEach((item) => {
      totals.totalQuantity += item.currentQuantity;
      totals.totalValue += item.totalValue || 0;
      totals.totalCost += item.totalCost || 0;

      const isLowStock = isProjectLowStock(item);
      if (isLowStock) {
        totals.lowStockItems++;
      }

      if (
        item.projectReorderPoint !== undefined &&
        item.projectReorderPoint !== null
      ) {
        totals.itemsWithProjectReorder++;
      }
    });

    return totals;
  };

  const totals = calculateTotals();

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quantity">Quantity</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="cost">Total Cost</SelectItem>
                <SelectItem value="transferred">Transferred In</SelectItem>
                <SelectItem value="lowstock">Low Stock First</SelectItem>
              </SelectContent>
            </Select>

            {/* Items per page selector */}
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="10 per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span>
              Showing{" "}
              <span className="font-semibold">{paginatedInventory.length}</span>{" "}
              of{" "}
              <span className="font-semibold">
                {filteredCurrentInventory.length}
              </span>{" "}
              items
              {filteredCurrentInventory.length !== currentInventory.length &&
                " (filtered)"}
            </span>
          </div>
          {totals.lowStockItems > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">{totals.lowStockItems}</span> low
              stock items
            </div>
          )}
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">{totals.totalQuantity}</span> total
            items in project
          </div>
        </div>
      </div>

      {/* Table Section */}
      {filteredCurrentInventory.length === 0 ? (
        <div className="text-center py-12 border border-zinc-200 rounded-lg">
          <Package className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">
            No inventory items found
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            {searchQuery || categoryFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "No inventory items are currently transferred to this project"}
          </p>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-lg overflow-hidden mb-4">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-zinc-50">
                <TableRow>
                  <TableHead className="w-[140px]">Product ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[160px]">Project Item ID</TableHead>
                  <TableHead className="text-right">Items in Project</TableHead>
                  <TableHead className="text-right">Transfer History</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInventory.map((item) => {
                  const inventoryItem = inventoryItems.get(item.product_id);
                  const unitPrice = getUnitPrice(item);
                  const hasSalePrice = hasValidSalePrice(item);
                  const mainInventoryItem = getMainInventoryItem(
                    item.product_id
                  );
                  const availableInMain = mainInventoryItem?.quantity || 0;
                  const isProcessing =
                    processingItemId === item.product_id && loading;
                  const isLowStock = isProjectLowStock(item);
                  const hasProjectReorder =
                    item.projectReorderPoint !== undefined &&
                    item.projectReorderPoint !== null;

                  // Find all transactions for this item
                  const itemRecords = records.filter(
                    (r) => r.product_id === item.product_id
                  );

                  // Find the most recent transaction for this item
                  const lastRecord =
                    itemRecords.length > 0
                      ? itemRecords.sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )[0]
                      : null;

                  // Calculate adjusted items from records if not available in item
                  const totalAdjustedFromRecords = itemRecords
                    .filter((r) => r.action === "adjusted")
                    .reduce((sum, r) => sum + r.quantity, 0);

                  // Calculate returned items from records if not available in item
                  const totalReturnedFromRecords = itemRecords
                    .filter((r) => r.action === "returned")
                    .reduce((sum, r) => sum + r.quantity, 0);

                  // Use the server-calculated values if available, otherwise calculate from records
                  const displayTotalAdjusted =
                    (item.totalAdjusted ?? 0) > 0
                      ? (item.totalAdjusted ?? 0)
                      : totalAdjustedFromRecords;

                  const displayTotalReturned =
                    item.totalReturnedOut > 0
                      ? item.totalReturnedOut
                      : totalReturnedFromRecords;

                  // Calculate the actual returned value (financial)
                  const totalReturnedValue = itemRecords
                    .filter((r) => r.action === "returned")
                    .reduce((sum, r) => sum + (r.totalValue || 0), 0);

                  return (
                    <TableRow
                      key={item.product_id}
                      className={`hover:bg-zinc-50 ${
                        isProcessing ? "opacity-70" : ""
                      }`}
                    >
                      <TableCell>
                        <div className="font-mono text-xs text-zinc-700">
                          {item.product_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                            <span>•</span>
                            <span>{item.supplier}</span>
                          </div>
                          {item.location && (
                            <div className="text-xs text-zinc-400 mt-1">
                              <Box className="h-3 w-3 inline mr-1" />
                              {item.location}
                            </div>
                          )}
                          <div className="text-xs text-zinc-400 mt-1">
                            Main Inventory: {availableInMain} {item.unit}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lastRecord ? (
                          <div className="text-xs">
                            <div className="font-mono text-zinc-700 truncate">
                              {lastRecord.projectInventory_id}
                            </div>
                            <div className="text-zinc-400 truncate">
                              {formatDate(lastRecord.createdAt)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-400 italic">
                            No transactions
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <div
                            className={`text-lg font-bold ${
                              isLowStock
                                ? "text-red-600"
                                : item.currentQuantity === 0
                                  ? "text-amber-600"
                                  : "text-zinc-900"
                            }`}
                          >
                            {Math.max(0, item.currentQuantity)}
                            {isProcessing && (
                              <Loader2 className="h-3 w-3 inline ml-1 animate-spin" />
                            )}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {item.unit}
                          </div>
                          {/* Show Project Reorder Point if set */}
                          {hasProjectReorder && (
                            <div className="text-xs text-purple-600 font-medium mt-1 flex items-center justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Tag className="h-2 w-2" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Project reorder point
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <span>
                                Reorder at: {item.projectReorderPoint}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-sm">
                            <span className="text-emerald-600">In: </span>
                            <span className="font-medium">
                              {item.totalTransferredIn || 0}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-blue-600">Out: </span>
                            <span className="font-medium">
                              {displayTotalReturned}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-amber-600">Used: </span>
                            <span className="font-medium">
                              {displayTotalAdjusted}
                            </span>
                          </div>
                          {item.lastTransaction && (
                            <div className="text-xs text-zinc-400">
                              Last: {formatTime(item.lastTransaction)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-sm">
                            <span className="font-medium">
                              {formatCurrency(item.totalCost)}
                            </span>
                            {hasSalePrice}
                          </div>
                          <div className="text-sm">
                            <span className="text-zinc-600">
                              Unit: {formatCurrency(unitPrice)}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-500">
                            {item.currentQuantity} × {formatCurrency(unitPrice)}
                          </div>
                          {totalReturnedValue > 0 && (
                            <div className="text-xs text-blue-500 mt-1">
                              Returned: {formatCurrency(totalReturnedValue)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusBadgeVariant(item)}`}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-default">
                                    {getItemStatus(item)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {hasProjectReorder
                                    ? `Low stock alert at ${item.projectReorderPoint} units`
                                    : "No low stock alert configured"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isProcessing}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {/* View Details */}
                              <DropdownMenuItem
                                onClick={() => {
                                  if (itemRecords.length > 0) {
                                    const latestRecord = itemRecords.sort(
                                      (a, b) =>
                                        new Date(b.createdAt).getTime() -
                                        new Date(a.createdAt).getTime()
                                    )[0];
                                    setViewDetails(latestRecord);
                                  }
                                }}
                                disabled={itemRecords.length === 0}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Check In */}
                              <DropdownMenuItem
                                onClick={() =>
                                  openActionDialog("checkout", item)
                                }
                                disabled={availableInMain === 0 || isProcessing}
                                className="text-emerald-600 focus:text-emerald-600"
                              >
                                <ArrowDownToLine className="h-4 w-4 mr-2" />
                                Check In
                                <div className="ml-auto text-xs text-muted-foreground">
                                  {availableInMain > 0 &&
                                    `${availableInMain} avail`}
                                </div>
                              </DropdownMenuItem>

                              {/* Return */}
                              <DropdownMenuItem
                                onClick={() => openActionDialog("return", item)}
                                disabled={
                                  item.currentQuantity === 0 || isProcessing
                                }
                                className="text-blue-600 focus:text-blue-600"
                              >
                                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                                Return
                                <div className="ml-auto text-xs text-muted-foreground">
                                  {item.currentQuantity > 0 &&
                                    `${item.currentQuantity} avail`}
                                </div>
                              </DropdownMenuItem>

                              {/* Use */}
                              <DropdownMenuItem
                                onClick={() => openActionDialog("use", item)}
                                disabled={
                                  item.currentQuantity === 0 || isProcessing
                                }
                                className="text-amber-600 focus:text-amber-600"
                              >
                                <Hammer className="h-4 w-4 mr-2" />
                                Mark as Used
                                <div className="ml-auto text-xs text-muted-foreground">
                                  {item.currentQuantity > 0 &&
                                    `${item.currentQuantity} avail`}
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination Controls - Only show if there are items */}
      {filteredCurrentInventory.length > 0 && (
        <div className="flex items-center justify-between px-2 py-4 border-t border-zinc-200">
          {/* Items per page info */}
          <div className="text-sm text-zinc-600">
            Showing{" "}
            <span className="font-medium">
              {startIndex + 1}-{endIndex}
            </span>{" "}
            of <span className="font-medium">{totalItems}</span> items
          </div>

          {/* Pagination buttons */}
          <div className="flex items-center gap-2">
            {/* First Page */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous Page */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {(() => {
                const pageButtons = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(
                  1,
                  currentPage - Math.floor(maxVisiblePages / 2)
                );
                let endPage = Math.min(
                  totalPages,
                  startPage + maxVisiblePages - 1
                );

                // Adjust start page if we're near the end
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                // Add first page button if needed
                if (startPage > 1) {
                  pageButtons.push(
                    <Button
                      key={1}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      className="h-8 w-8"
                    >
                      1
                    </Button>
                  );
                  if (startPage > 2) {
                    pageButtons.push(
                      <span key="dots1" className="px-2 text-zinc-400">
                        ...
                      </span>
                    );
                  }
                }

                // Add page number buttons
                for (let i = startPage; i <= endPage; i++) {
                  pageButtons.push(
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(i)}
                      className={`h-8 w-8 ${
                        currentPage === i
                          ? "bg-zinc-900 text-white hover:bg-zinc-800"
                          : ""
                      }`}
                    >
                      {i}
                    </Button>
                  );
                }

                // Add last page button if needed
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pageButtons.push(
                      <span key="dots2" className="px-2 text-zinc-400">
                        ...
                      </span>
                    );
                  }
                  pageButtons.push(
                    <Button
                      key={totalPages}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      className="h-8 w-8"
                    >
                      {totalPages}
                    </Button>
                  );
                }

                return pageButtons;
              })()}
            </div>

            {/* Next Page */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Go to page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">Go to page:</span>
            <Input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (!isNaN(page) && page >= 1 && page <= totalPages) {
                  handlePageChange(page);
                }
              }}
              onBlur={(e) => {
                if (e.target.value === "" || parseInt(e.target.value) < 1) {
                  handlePageChange(1);
                } else if (parseInt(e.target.value) > totalPages) {
                  handlePageChange(totalPages);
                }
              }}
              className="w-16 h-8 text-center"
            />
            <span className="text-sm text-zinc-600">of {totalPages}</span>
          </div>
        </div>
      )}

      {/* Action Dialog for Check In, Return, or Use */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
      >
        <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {actionDialog.type === "checkout" ? (
                <>
                  <ArrowDownToLine className="h-5 w-5 text-emerald-600" />
                  Check In to Project
                </>
              ) : actionDialog.type === "return" ? (
                <>
                  <ArrowUpFromLine className="h-5 w-5 text-blue-600" />
                  Return to Main
                </>
              ) : (
                <>
                  <Hammer className="h-5 w-5 text-amber-600" />
                  Use Item
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {actionDialog.type === "checkout"
                ? "Transfer from main inventory to project"
                : actionDialog.type === "return"
                  ? "Return from project to main inventory"
                  : "Mark as used in construction"}
            </DialogDescription>
          </DialogHeader>

          {actionDialog.item && (
            <div className="py-2 space-y-4">
              {/* Compact Item Info */}
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-zinc-700">
                    Item
                  </span>
                  <span className="text-sm font-medium">
                    {actionDialog.item.name}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-500">
                  <span>Category</span>
                  <span>{actionDialog.item.category}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-500">
                  <span>Unit</span>
                  <span>{actionDialog.item.unit}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-500">
                  <span>Unit Price</span>
                  <span>{formatCurrency(getUnitPrice(actionDialog.item))}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-500 mt-1">
                  <span>Current in Project</span>
                  <span className="font-medium">
                    {actionDialog.item.currentQuantity} {actionDialog.item.unit}
                  </span>
                </div>
                {/* Show Project Reorder Point if set */}
                {actionDialog.item.projectReorderPoint !== undefined &&
                  actionDialog.item.projectReorderPoint !== null && (
                    <div className="flex justify-between items-center text-xs text-purple-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Tag className="h-2 w-2" />
                        Project Reorder Point
                      </span>
                      <span className="font-medium">
                        {actionDialog.item.projectReorderPoint}
                      </span>
                    </div>
                  )}
              </div>

              {/* Stock Information */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700">
                    Available to{" "}
                    {actionDialog.type === "checkout"
                      ? "Check In"
                      : actionDialog.type === "return"
                        ? "Return"
                        : "Use"}
                    :
                  </span>
                  <span className="font-bold">
                    {getMaxQuantity(actionDialog.item, actionDialog.type)}{" "}
                    {actionDialog.item.unit}
                  </span>
                </div>
                {actionDialog.type === "checkout" && (
                  <div className="flex items-center justify-between text-sm text-zinc-600">
                    <span>Available in Main:</span>
                    <span>
                      {getMaxQuantity(actionDialog.item, "checkout")}{" "}
                      {actionDialog.item.unit}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Quantity to{" "}
                  {actionDialog.type === "checkout"
                    ? "Check In"
                    : actionDialog.type === "return"
                      ? "Return"
                      : "Use"}
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-8 w-8"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={
                      actionDialog.item
                        ? getMaxQuantity(actionDialog.item, actionDialog.type)
                        : 1
                    }
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const max = actionDialog.item
                        ? getMaxQuantity(actionDialog.item, actionDialog.type)
                        : 1;
                      if (!isNaN(value) && value > 0 && value <= max) {
                        setQuantity(value);
                      } else if (value > max) {
                        setQuantity(max);
                      } else if (e.target.value === "") {
                        setQuantity(1);
                      }
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        parseInt(e.target.value) < 1
                      ) {
                        setQuantity(1);
                      }
                    }}
                    className="text-center h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const max = actionDialog.item
                        ? getMaxQuantity(actionDialog.item, actionDialog.type)
                        : 1;
                      setQuantity(Math.min(max, quantity + 1));
                    }}
                    disabled={
                      actionDialog.item
                        ? quantity >=
                          getMaxQuantity(actionDialog.item, actionDialog.type)
                        : true
                    }
                    className="h-8 w-8"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">
                  Max:{" "}
                  {actionDialog.item
                    ? getMaxQuantity(actionDialog.item, actionDialog.type)
                    : 1}{" "}
                  {actionDialog.item?.unit}
                </p>
              </div>

              {/* Financial Info - For checkout and return only */}
              {actionDialog.type !== "use" && (
                <div
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor:
                      actionDialog.type === "checkout" ? "#f0fdf4" : "#eff6ff",
                    borderColor:
                      actionDialog.type === "checkout" ? "#bbf7d0" : "#bfdbfe",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color:
                          actionDialog.type === "checkout"
                            ? "#059669"
                            : "#2563eb",
                      }}
                    >
                      {actionDialog.type === "checkout"
                        ? "Added to Project"
                        : "Subtracted from Project"}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{
                        color:
                          actionDialog.type === "checkout"
                            ? "#059669"
                            : "#2563eb",
                      }}
                    >
                      {formatCurrency(
                        quantity * getUnitPrice(actionDialog.item)
                      )}
                    </span>
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{
                      color:
                        actionDialog.type === "checkout"
                          ? "#059669"
                          : "#2563eb",
                    }}
                  >
                    {quantity} ×{" "}
                    {formatCurrency(getUnitPrice(actionDialog.item))}
                  </p>
                  {actionDialog.type === "return" && (
                    <p className="text-xs text-blue-600 mt-1">
                      Value will be returned to main inventory
                    </p>
                  )}
                </div>
              )}

              {/* Use Action Special Note */}
              {actionDialog.type === "use" && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Hammer className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                    <div className="text-xs text-amber-700">
                      <p className="font-medium mb-1">Important Note:</p>
                      <p>
                        • Reduces quantity only
                        <br />
                        • Project financial amount remains unchanged
                        <br />
                        • This action cannot be undone
                        <br />• Used for tracking consumption in construction
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    actionDialog.type === "checkout"
                      ? "Why are you checking in these items? (e.g., for specific task/phase)"
                      : actionDialog.type === "return"
                        ? "Why are you returning these items? (e.g., excess materials)"
                        : "Where/how were these items used? (e.g., foundation work, framing)"
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, type: "checkout", item: null })
              }
              disabled={loading}
              size="sm"
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleActionSubmit}
              disabled={loading}
              size="sm"
              className={`h-9 ${
                actionDialog.type === "checkout"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : actionDialog.type === "return"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {actionDialog.type === "checkout"
                ? "Check In"
                : actionDialog.type === "return"
                  ? "Return"
                  : "Mark as Used"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
