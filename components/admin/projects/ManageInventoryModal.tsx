// components/projects/ManageInventoryModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Search,
  Package,
  AlertCircle,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  ListChecks,
  Settings,
  Copy,
  SlidersHorizontal,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { getInventories } from "@/action/inventory";
import { IInventory } from "@/types/Inventory";
import { createProjectInventory } from "@/action/project-inventory";
import { useAuthStore } from "@/lib/stores";

interface ManageInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

interface SelectedItem {
  item: IInventory;
  quantity: string;
  action: "checked_out" | "returned" | "adjusted";
  notes: string;
  projectReorderPoint: string; // Changed to string for input handling
}

// Bulk Actions Dialog Component - UPDATED: Added projectReorderPoint
function BulkActionsDialog({
  open,
  onOpenChange,
  selectedItems,
  onApplyBulkUpdates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: SelectedItem[];
  onApplyBulkUpdates: (
    bulkAction: "checked_out" | "returned" | "adjusted",
    bulkNotes: string,
    bulkReorderPoint: string
  ) => void;
}) {
  const [bulkAction, setBulkAction] = useState<
    "checked_out" | "returned" | "adjusted"
  >("checked_out");
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkProjectReorderPoint, setBulkProjectReorderPoint] = useState("");

  const handleApply = () => {
    onApplyBulkUpdates(bulkAction, bulkNotes, bulkProjectReorderPoint);
    setBulkNotes("");
    setBulkProjectReorderPoint("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Bulk Actions
          </DialogTitle>
          <DialogDescription>
            Apply these settings to all {selectedItems.length} selected items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Action Type for All Items
              </Label>
              <Select
                value={bulkAction}
                onValueChange={(
                  value: "checked_out" | "returned" | "adjusted"
                ) => setBulkAction(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checked_out">Check Out</SelectItem>
                  <SelectItem value="returned">Return</SelectItem>
                  <SelectItem value="adjusted">Adjust</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500">
                This action will be applied to all selected items
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Apply Notes to All Items
              </Label>
              <Textarea
                placeholder="These notes will be applied to all selected items..."
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-zinc-500">
                Existing notes will be replaced with this text
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Project Reorder Point
                </Label>
                <Badge variant="outline" className="text-xs">
                  Custom for project
                </Badge>
              </div>
              <Input
                type="number"
                min="0"
                placeholder="Set reorder point for all selected items..."
                value={bulkProjectReorderPoint}
                onChange={(e) => setBulkProjectReorderPoint(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-zinc-500">
                This sets a custom reorder point for tracking low stock
                specifically in this project. Leave empty to use inventory
                default.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setBulkNotes("");
              setBulkProjectReorderPoint("");
              setBulkAction("checked_out");
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleApply} className="gap-2">
            <Check className="h-4 w-4" />
            Apply to {selectedItems.length} Items
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ManageInventoryModal({
  open,
  onOpenChange,
  projectId,
  projectName,
}: ManageInventoryModalProps) {
  const { user } = useAuthStore();
  const [inventories, setInventories] = useState<IInventory[]>([]);
  const [filteredInventories, setFilteredInventories] = useState<IInventory[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Multi-select state
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Dialog state
  const [showBulkActionsDialog, setShowBulkActionsDialog] = useState(false);

  // Check if user has permission (Project Manager or Admin)
  const canManageInventory =
    user?.role === "project_manager" || user?.role === "admin";

  // Fetch available inventory
  useEffect(() => {
    if (open && canManageInventory) {
      fetchInventories();
    }
  }, [open, canManageInventory]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredInventories(inventories);
    } else {
      const filtered = inventories.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.product_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredInventories(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery, inventories]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredInventories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredInventories.slice(startIndex, endIndex);

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const data = await getInventories();
      setInventories(data);
      setFilteredInventories(data);
      setSelectedItems([]); // Clear selections when reloading
    } catch (error) {
      toast.error("Failed to load inventory");
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if an item is selected
  const isItemSelected = (productId: string) => {
    return selectedItems.some(
      (selected) => selected.item.product_id === productId
    );
  };

  // Get selected item details
  const getSelectedItem = (productId: string) => {
    return selectedItems.find(
      (selected) => selected.item.product_id === productId
    );
  };

  // Toggle item selection - UPDATED: Initialize with empty projectReorderPoint
  const toggleItemSelection = (item: IInventory) => {
    if (isItemSelected(item.product_id)) {
      // Remove from selection
      setSelectedItems(
        selectedItems.filter(
          (selected) => selected.item.product_id !== item.product_id
        )
      );
    } else {
      // Add to selection with default values
      setSelectedItems([
        ...selectedItems,
        {
          item,
          quantity: "1",
          action: "checked_out",
          notes: "",
          projectReorderPoint: "", // Empty by default
        },
      ]);
    }
  };

  // Update selected item field
  const updateSelectedItem = (
    productId: string,
    field: keyof SelectedItem,
    value: string
  ) => {
    setSelectedItems(
      selectedItems.map((selected) => {
        if (selected.item.product_id === productId) {
          return { ...selected, [field]: value };
        }
        return selected;
      })
    );
  };

  // Select all items on current page
  const selectAllOnPage = () => {
    const newSelections = [...selectedItems];

    currentItems.forEach((item) => {
      if (!isItemSelected(item.product_id)) {
        newSelections.push({
          item,
          quantity: "1",
          action: "checked_out",
          notes: "",
          projectReorderPoint: "", // Empty by default
        });
      }
    });

    setSelectedItems(newSelections);
  };

  // Deselect all items on current page
  const deselectAllOnPage = () => {
    const currentPageIds = new Set(currentItems.map((item) => item.product_id));
    setSelectedItems(
      selectedItems.filter(
        (selected) => !currentPageIds.has(selected.item.product_id)
      )
    );
  };

  // Apply bulk updates to all selected items
  const handleBulkUpdates = (
    bulkAction: "checked_out" | "returned" | "adjusted",
    bulkNotes: string,
    bulkReorderPoint: string
  ) => {
    if (selectedItems.length === 0) {
      toast.error("No items selected");
      return;
    }

    setSelectedItems(
      selectedItems.map((selected) => {
        const updated = { ...selected };
        if (bulkAction) {
          updated.action = bulkAction;
        }
        if (bulkNotes.trim() !== "") {
          updated.notes = bulkNotes;
        }
        if (bulkReorderPoint.trim() !== "") {
          updated.projectReorderPoint = bulkReorderPoint;
        }
        return updated;
      })
    );

    toast.success(`Updated ${selectedItems.length} item(s)`);
  };

  // Validate all selected items before submission - UPDATED: Validate projectReorderPoint
  const validateSelections = () => {
    for (const selected of selectedItems) {
      const quantityNum = parseInt(selected.quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        toast.error(`Invalid quantity for ${selected.item.name}`);
        return false;
      }

      // Validate projectReorderPoint if provided
      if (selected.projectReorderPoint.trim() !== "") {
        const reorderNum = parseInt(selected.projectReorderPoint);
        if (isNaN(reorderNum) || reorderNum < 0) {
          toast.error(
            `Invalid reorder point for ${selected.item.name}. Must be a non-negative number.`
          );
          return false;
        }
      }

      if (
        selected.action === "checked_out" &&
        quantityNum > selected.item.quantity
      ) {
        toast.error(
          `Insufficient stock for ${selected.item.name}. Only ${selected.item.quantity} available`
        );
        return false;
      }
    }
    return true;
  };

  // Handle submission - UPDATED: Properly handle projectReorderPoint
  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    if (!validateSelections()) {
      return;
    }

    setSubmitting(true);
    const promises = selectedItems.map(async (selected) => {
      const quantityNum = parseInt(selected.quantity);

      // Prepare data - initialize without projectReorderPoint
      const inventoryData: any = {
        project_id: projectId,
        product_id: selected.item.product_id,
        quantity: quantityNum,
        unit: selected.item.unit,
        notes: selected.notes,
        action: selected.action,
        action_by: {
          user_id: user!.user_id,
          name:
            `${user!.firstName || ""} ${user!.lastName || ""}`.trim() ||
            user!.email,
          role: user!.role,
        },
      };

      // Only include projectReorderPoint if it's provided and valid
      if (selected.projectReorderPoint.trim() !== "") {
        const reorderNum = parseInt(selected.projectReorderPoint);
        if (!isNaN(reorderNum) && reorderNum >= 0) {
          inventoryData.projectReorderPoint = reorderNum;
        }
        // If empty string, do not include the field (backend will treat as undefined)
      }

      return createProjectInventory(inventoryData);
    });

    try {
      const results = await Promise.all(promises);
      const allSuccess = results.every((result) => result.success);

      if (allSuccess) {
        toast.success(`Successfully processed ${selectedItems.length} item(s)`);
        resetForm();
        onOpenChange(false);
      } else {
        const errors = results
          .filter((result) => !result.success)
          .map((result) => result.error)
          .join(", ");
        toast.error(`Some items failed: ${errors}`);
      }
    } catch (error) {
      toast.error("An error occurred while processing items");
      console.error("Error processing inventory:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedItems([]);
  };

  if (!canManageInventory) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Access Restricted
            </DialogTitle>
            <DialogDescription>
              Only Project Managers and Administrators can manage project
              inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-600">
              Your current role ({user?.role || "user"}) does not have
              permission to access this feature.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {/* Bulk Actions Dialog */}
      <BulkActionsDialog
        open={showBulkActionsDialog}
        onOpenChange={setShowBulkActionsDialog}
        selectedItems={selectedItems}
        onApplyBulkUpdates={handleBulkUpdates}
      />

      {/* Main Inventory Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manage Project Inventory
            </DialogTitle>
            <DialogDescription>
              {projectName} • Select items to check out, return, or adjust
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-6">
              {/* Left Column: Available Inventory */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Available Inventory ({filteredInventories.length} items)
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllOnPage}
                        className="h-8 text-xs"
                      >
                        Select Page
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deselectAllOnPage}
                        className="h-8 text-xs"
                      >
                        Deselect Page
                      </Button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9 text-sm w-48"
                      />
                    </div>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) =>
                        setItemsPerPage(parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-24 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="25">25 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mr-2" />
                      <span className="text-sm text-zinc-500">
                        Loading inventory...
                      </span>
                    </div>
                  ) : filteredInventories.length === 0 ? (
                    <div className="p-8 text-center">
                      <Package className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500">
                        No inventory items found
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-zinc-50">
                            <TableRow>
                              <TableHead className="w-[60px] text-center">
                                <Checkbox
                                  checked={
                                    currentItems.length > 0 &&
                                    currentItems.every((item) =>
                                      isItemSelected(item.product_id)
                                    )
                                  }
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      selectAllOnPage();
                                    } else {
                                      deselectAllOnPage();
                                    }
                                  }}
                                  className="border-zinc-300"
                                />
                              </TableHead>
                              <TableHead className="w-[120px]">
                                Product ID
                              </TableHead>
                              <TableHead>Item</TableHead>
                              <TableHead className="text-right">
                                Stock
                              </TableHead>
                              <TableHead className="text-right">
                                Default Reorder Point
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentItems.map((item) => {
                              const isSelected = isItemSelected(
                                item.product_id
                              );
                              const isLowStock =
                                item.quantity <= item.reorderPoint;
                              const selectedItem = getSelectedItem(
                                item.product_id
                              );

                              return (
                                <TableRow
                                  key={item.product_id}
                                  className={`hover:bg-zinc-50 ${
                                    isSelected ? "bg-blue-50" : ""
                                  }`}
                                >
                                  <TableCell className="text-center">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() =>
                                        toggleItemSelection(item)
                                      }
                                      className="border-zinc-300"
                                    />
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {item.product_id}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium text-sm">
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                      {item.category}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="font-medium">
                                      {item.quantity} {item.unit}
                                    </div>
                                    {isLowStock && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-red-50 text-red-700 border-red-200 mt-1"
                                      >
                                        Low Stock
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="font-medium">
                                      {item.reorderPoint || 0}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                      (Inventory default)
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                          <div className="text-sm text-zinc-500">
                            Showing {startIndex + 1} to{" "}
                            {Math.min(endIndex, filteredInventories.length)} of{" "}
                            {filteredInventories.length} items
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                              }
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(prev + 1, totalPages)
                                )
                              }
                              disabled={currentPage === totalPages}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: Selected Items Panel */}
              <div className="space-y-4">
                {/* Selected Items Counter */}
                <div className="bg-white p-4 rounded-lg border border-zinc-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-zinc-900">
                        Selected Items
                      </span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {selectedItems.length}
                    </Badge>
                  </div>
                  {selectedItems.length === 0 ? (
                    <p className="text-sm text-zinc-500 mt-2">
                      Select items from the list to proceed
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => setShowBulkActionsDialog(true)}
                      >
                        <Settings className="h-4 w-4" />
                        Bulk Actions & Set Action Type
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setSelectedItems([])}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Selected
                      </Button>
                    </div>
                  )}
                </div>

                {/* Selected Items List - FIXED SCROLLING */}
                {selectedItems.length > 0 && (
                  <div className="flex flex-col h-[calc(100vh-450px)] min-h-[300px]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-zinc-900">
                        Selected Items Details
                      </h3>
                      <span className="text-xs text-zinc-500">
                        {selectedItems.length} item(s)
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                      {selectedItems.map((selected) => {
                        const item = selected.item;
                        // Calculate low stock based on projectReorderPoint or inventory default
                        const effectiveReorderPoint =
                          selected.projectReorderPoint
                            ? parseInt(selected.projectReorderPoint)
                            : item.reorderPoint || 0;
                        const isLowStock =
                          effectiveReorderPoint > 0
                            ? parseInt(selected.quantity) <=
                              effectiveReorderPoint
                            : false;

                        return (
                          <div
                            key={item.product_id}
                            className="bg-white p-3 rounded-lg border border-zinc-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-medium text-sm line-clamp-1">
                                  {item.name}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono">
                                  {item.product_id}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 flex-shrink-0"
                                onClick={() => toggleItemSelection(item)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Quantity</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max={
                                      selected.action === "checked_out"
                                        ? item.quantity
                                        : undefined
                                    }
                                    value={selected.quantity}
                                    onChange={(e) =>
                                      updateSelectedItem(
                                        item.product_id,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Action</Label>
                                  <div className="flex items-center gap-1 h-8 px-3 rounded-md border border-input bg-background text-sm">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs capitalize ${
                                        selected.action === "checked_out"
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : selected.action === "returned"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-blue-50 text-blue-700 border-blue-200"
                                      }`}
                                    >
                                      {selected.action.replace("_", " ")}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">
                                    Project Reorder Point
                                  </Label>
                                  <span className="text-xs text-zinc-500">
                                    Default: {item.reorderPoint || 0}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="Set custom reorder point..."
                                    value={selected.projectReorderPoint}
                                    onChange={(e) =>
                                      updateSelectedItem(
                                        item.product_id,
                                        "projectReorderPoint",
                                        e.target.value
                                      )
                                    }
                                    className="h-8 text-sm"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 flex-shrink-0"
                                    onClick={() =>
                                      updateSelectedItem(
                                        item.product_id,
                                        "projectReorderPoint",
                                        item.reorderPoint?.toString() || ""
                                      )
                                    }
                                    title="Use default reorder point"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                {selected.projectReorderPoint ? (
                                  <div className="text-xs text-zinc-600">
                                    Project will use:{" "}
                                    {selected.projectReorderPoint}
                                    {isLowStock && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-200"
                                      >
                                        Will be low stock
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs text-zinc-500">
                                    Leave empty to use default (
                                    {item.reorderPoint || 0})
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Notes</Label>
                                <Textarea
                                  placeholder="Item notes..."
                                  value={selected.notes}
                                  onChange={(e) =>
                                    updateSelectedItem(
                                      item.product_id,
                                      "notes",
                                      e.target.value
                                    )
                                  }
                                  rows={1}
                                  className="text-sm resize-none"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action By Info */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-800 mb-1">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Action by</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-blue-600">Name:</span>
                      <span className="font-medium ml-2">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-600">Role:</span>
                      <span className="font-medium ml-2 capitalize">
                        {user?.role}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-600">Date:</span>
                      <span className="font-medium ml-2">
                        {new Date().toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-zinc-500">
                  {selectedItems.length} item(s) selected
                </div>
                {selectedItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkActionsDialog(true)}
                    className="gap-2"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Bulk Actions
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedItems.length === 0 || submitting}
                  className="gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Process {selectedItems.length} Item(s)
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
