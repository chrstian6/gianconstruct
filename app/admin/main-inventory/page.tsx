// app/admin/main-inventory/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { IInventory } from "@/types/Inventory";
import {
  getInventories,
  createInventory,
  updateInventory,
  deleteInventory,
} from "@/action/inventory";
import { InventoryTable } from "@/components/admin/inventory/Table";
import { InventoryGrid } from "@/components/admin/inventory/InventoryGrid";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/stores";
import { AddItemModal } from "@/components/admin/inventory/AddItemModal";
import { EditItemModal } from "@/components/admin/inventory/EditItemModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  X,
  Filter,
  Download,
  Rows4,
  Grid3X3,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CategoryBarChart } from "@/components/admin/inventory/CategoryBarChart";
import { motion, AnimatePresence } from "framer-motion";

type StatusFilter = "all" | "inStock" | "lowStock" | "outOfStock";
type CategoryFilter = "all" | string;
type ViewMode = "table" | "grid";

export default function MainInventory() {
  const [items, setItems] = useState<IInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IInventory | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [showChart, setShowChart] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    sku: true,
    name: true,
    category: true,
    quantity: true,
    unit: true,
    unitCost: true,
    totalCost: true,
    location: true,
    supplier: true,
    reorderPoint: true,
    status: true,
    actions: true,
  });

  // Extract the modal state from the store
  const {
    isCreateProjectOpen,
    setIsCreateProjectOpen,
    isEditInventoryOpen,
    setIsEditInventoryOpen,
    editingInventory,
  } = useModalStore();

  // Fetch items
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getInventories();
        setItems(data);
      } catch (error) {
        console.error("Failed to fetch inventory:", error);
        toast.error("Failed to fetch inventory items");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    items.forEach((item) => {
      if (item.category) {
        uniqueCategories.add(item.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [items]);

  // Filter items based on search term and filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (
        searchTerm &&
        !(
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.item_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description &&
            item.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (item.location &&
            item.location.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "inStock" && item.quantity <= 0) return false;
        if (statusFilter === "outOfStock" && item.quantity > 0) return false;
        if (
          statusFilter === "lowStock" &&
          (item.quantity > item.reorderPoint || item.quantity === 0)
        ) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [items, searchTerm, statusFilter, categoryFilter]);

  // Calculate inventory stats
  const inventoryStats = useMemo(() => {
    const inStock = filteredItems.filter((item) => item.quantity > 0).length;
    const lowStock = filteredItems.filter(
      (item) => item.quantity > 0 && item.quantity <= item.reorderPoint
    ).length;
    const outOfStock = filteredItems.filter(
      (item) => item.quantity === 0
    ).length;
    const restockNeeded = filteredItems.filter(
      (item) => item.quantity <= item.reorderPoint
    ).length;
    return {
      inStock,
      lowStock,
      outOfStock,
      restockNeeded,
      total: filteredItems.length,
    };
  }, [filteredItems]);

  const hasActiveFilters = useMemo(
    () => searchTerm || statusFilter !== "all" || categoryFilter !== "all",
    [searchTerm, statusFilter, categoryFilter]
  );

  // Add item
  const handleAdd = async (
    newItem: Omit<
      IInventory,
      | "item_id"
      | "sku"
      | "timeCreated"
      | "timeUpdated"
      | "lastUpdated"
      | "createdAt"
    >
  ) => {
    try {
      console.log("handleAdd input:", newItem);
      const result = await createInventory(newItem);
      if (result.success && result.item) {
        setItems((prev) => [...prev, result.item]);
        setIsCreateProjectOpen(false);
        toast.success("Item added successfully");
      } else {
        toast.error(result.error || "Failed to add item");
      }
    } catch (error) {
      toast.error("Failed to add item");
      console.error("Error creating item:", error);
    }
  };

  // Edit item
  const handleEdit = useCallback(
    (item: IInventory) => {
      setIsEditInventoryOpen(true, item);
    },
    [setIsEditInventoryOpen]
  );

  // Update item
  const handleUpdate = async (
    item_id: string,
    data: Partial<
      Omit<
        IInventory,
        | "item_id"
        | "sku"
        | "timeCreated"
        | "timeUpdated"
        | "lastUpdated"
        | "createdAt"
      >
    >
  ) => {
    try {
      const result = await updateInventory(item_id, data);
      if (result.success && result.item) {
        setItems((prev) =>
          prev.map((item) => (item.item_id === item_id ? result.item : item))
        );
        setIsEditInventoryOpen(false, null);
        toast.success("Item updated successfully");
      } else {
        toast.error(result.error || "Failed to update item");
      }
    } catch (error) {
      toast.error("Failed to update item");
      console.error("Error updating item:", error);
    }
  };

  // Delete item using item_id
  const handleDelete = async (item_id: string) => {
    try {
      const result = await deleteInventory(item_id);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.item_id !== item_id));
        toast.success("Item deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete item");
      }
    } catch (error) {
      toast.error("Failed to delete item");
      console.error("Error deleting item:", error);
    }
  };

  // Export to CSV - professional format with custom header
  const handleExportCSV = useCallback(() => {
    const formatDateForExport = (dateString: string | undefined): string => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch {
        return "";
      }
    };

    const headers = [
      columnVisibility.id && "Item ID",
      columnVisibility.sku && "SKU",
      columnVisibility.name && "Name",
      columnVisibility.category && "Category",
      columnVisibility.quantity && "Quantity",
      columnVisibility.unit && "Unit",
      "Description",
      columnVisibility.supplier && "Supplier",
      columnVisibility.reorderPoint && "Reorder Point",
      "Safety Stock",
      columnVisibility.location && "Location",
      columnVisibility.unitCost && "Unit Cost",
      columnVisibility.totalCost && "Total Value",
      "Created At",
      "Updated At",
    ].filter(Boolean) as string[];

    const rows = filteredItems.map((item) => {
      const unitCost = item.unitCost ?? 0;
      const calculatedTotalCost = item.quantity * unitCost;

      return [
        columnVisibility.id && item.item_id,
        columnVisibility.sku && item.sku,
        columnVisibility.name && item.name,
        columnVisibility.category && item.category,
        columnVisibility.quantity && item.quantity.toString(),
        columnVisibility.unit && item.unit,
        item.description || "",
        columnVisibility.supplier && (item.supplier || ""),
        columnVisibility.reorderPoint && item.reorderPoint.toString(),
        (item.safetyStock ?? 0).toString(),
        columnVisibility.location && (item.location || ""),
        columnVisibility.unitCost && `₱${unitCost.toLocaleString()}`,
        columnVisibility.totalCost &&
          `₱${calculatedTotalCost.toLocaleString()}`,
        formatDateForExport(item.createdAt || item.timeCreated),
        formatDateForExport(item.lastUpdated || item.timeUpdated),
      ].filter((cell, index) => headers[index] !== undefined && cell !== false);
    });

    // Professional header information
    const exportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Calculate total inventory value
    const totalInventoryValue = filteredItems.reduce(
      (total, item) => total + item.quantity * (item.unitCost || 0),
      0
    );

    const customHeader = [
      "GIAN CONSTRUCTION & SUPPLIES",
      "JY Pereze Avenue, Kabankalan City",
      "INVENTORY REPORT",
      "",
      `Report Date: ${exportDate}`,
      `Total Items: ${filteredItems.length}`,
      `Total Inventory Value: ₱${totalInventoryValue.toLocaleString()}`,
      "", // Empty line for spacing
    ];

    const csvContent = [
      ...customHeader.map((line) => `"${line}"`),
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Gian_Construction_Inventory_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Inventory report exported to CSV");
  }, [filteredItems, columnVisibility]);

  const handleDeleteClick = useCallback((item: IInventory) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;
    await handleDelete(itemToDelete.item_id);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  }, [itemToDelete, handleDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
  }, []);

  const toggleColumnVisibility = (column: keyof typeof columnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  return (
    <div className="flex flex-col font-geist">
      {/* Header Section */}
      <div className="flex-shrink-0">
        <div className="p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex gap-4 mt-1 text-sm text-gray-600">
                <p>Total Items: {inventoryStats.total}</p>
                <p>In Stock: {inventoryStats.inStock}</p>
                <p>Restock Needed: {inventoryStats.restockNeeded}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 rounded-sm border-gray-200 border-1 border-b-0 font-geist h-8 text-sm"
                />
                {searchTerm && (
                  <X
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700"
                    onClick={() => setSearchTerm("")}
                  />
                )}
              </div>

              <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-sm gap-2 font-geist"
                    disabled={loading}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge
                        variant="secondary"
                        className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center bg-gray-900 text-white"
                      >
                        !
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-white font-geist"
                  align="start"
                >
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className={statusFilter === "all" ? "bg-gray-100" : ""}
                      onClick={() => setStatusFilter("all")}
                    >
                      All Items
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={
                        statusFilter === "inStock" ? "bg-gray-100" : ""
                      }
                      onClick={() => setStatusFilter("inStock")}
                    >
                      In Stock
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={
                        statusFilter === "lowStock" ? "bg-gray-100" : ""
                      }
                      onClick={() => setStatusFilter("lowStock")}
                    >
                      Low Stock
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={
                        statusFilter === "outOfStock" ? "bg-gray-100" : ""
                      }
                      onClick={() => setStatusFilter("outOfStock")}
                    >
                      Out of Stock
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  {categories.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          className={
                            categoryFilter === "all" ? "bg-gray-100" : ""
                          }
                          onClick={() => setCategoryFilter("all")}
                        >
                          All Categories
                        </DropdownMenuItem>
                        {categories.map((category) => (
                          <DropdownMenuItem
                            key={category}
                            className={
                              categoryFilter === category ? "bg-gray-100" : ""
                            }
                            onClick={() => setCategoryFilter(category)}
                          >
                            {category}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </>
                  )}

                  {hasActiveFilters && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearFilters}>
                        Clear Filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="rounded-sm text-gray-600 hover:text-gray-900 font-geist"
                >
                  Clear
                  <X className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("table")}
                className={viewMode === "table" ? "bg-gray-100" : ""}
                aria-label="Table view"
                disabled={loading}
              >
                <Rows4 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-gray-100" : ""}
                aria-label="Grid view"
                disabled={loading}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setIsCreateProjectOpen(true)}
                variant="default"
                size="sm"
                className="rounded-sm whitespace-nowrap font-geist"
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportCSV}
                className="rounded-sm font-geist gap-2"
                disabled={loading || filteredItems.length === 0}
                title={filteredItems.length === 0 ? "No items to export" : ""}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-5 pt-2 pb-2">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Chart Section - Conditionally Rendered with Framer Motion */}
          <AnimatePresence>
            {showChart && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  exit={{ y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {/* Mobile chart - visible only on small screens */}
                  <div className="lg:hidden">
                    <CategoryBarChart />
                  </div>

                  {/* Desktop chart - takes full width on desktop */}
                  <div className="hidden lg:block lg:col-span-2">
                    <CategoryBarChart />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inventory Table/Grid Section */}
          {filteredItems.length === 0 && !loading ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-2">
                <div className="text-center p-8">
                  <h3 className="text-xl font-semibold text-gray-900 font-geist">
                    No items found
                  </h3>
                  <p className="text-gray-600 mt-2 font-geist">
                    {hasActiveFilters
                      ? "Try adjusting your filters or search query."
                      : "No inventory items available. Add a new item to get started."}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      onClick={clearFilters}
                      variant="custom"
                      size="sm"
                      className="mt-4 rounded-sm font-geist"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5">
                  <div>
                    <CardTitle className="text-foreground-900 font-geist">
                      Inventory Management
                    </CardTitle>
                    <CardDescription className="font-geist">
                      View and manage all inventory items in your system
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-sm font-geist gap-2"
                        >
                          Columns <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.id}
                          onCheckedChange={() => toggleColumnVisibility("id")}
                        >
                          ID
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.sku}
                          onCheckedChange={() => toggleColumnVisibility("sku")}
                        >
                          SKU
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.name}
                          onCheckedChange={() => toggleColumnVisibility("name")}
                        >
                          Name
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.category}
                          onCheckedChange={() =>
                            toggleColumnVisibility("category")
                          }
                        >
                          Category
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.quantity}
                          onCheckedChange={() =>
                            toggleColumnVisibility("quantity")
                          }
                        >
                          Quantity
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.unit}
                          onCheckedChange={() => toggleColumnVisibility("unit")}
                        >
                          Unit
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.unitCost}
                          onCheckedChange={() =>
                            toggleColumnVisibility("unitCost")
                          }
                        >
                          Unit Cost
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.totalCost}
                          onCheckedChange={() =>
                            toggleColumnVisibility("totalCost")
                          }
                        >
                          Total Cost
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.location}
                          onCheckedChange={() =>
                            toggleColumnVisibility("location")
                          }
                        >
                          Location
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.supplier}
                          onCheckedChange={() =>
                            toggleColumnVisibility("supplier")
                          }
                        >
                          Supplier
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.reorderPoint}
                          onCheckedChange={() =>
                            toggleColumnVisibility("reorderPoint")
                          }
                        >
                          Reorder Point
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.status}
                          onCheckedChange={() =>
                            toggleColumnVisibility("status")
                          }
                        >
                          Status
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility.actions}
                          onCheckedChange={() =>
                            toggleColumnVisibility("actions")
                          }
                        >
                          Actions
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowChart(!showChart)}
                      className="rounded-sm font-geist gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      {showChart ? "Hide Analytics" : "Show Analytics"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full rounded-md border">
                  {viewMode === "table" ? (
                    <InventoryTable
                      items={filteredItems}
                      loading={loading}
                      onDelete={handleDeleteClick}
                      onEdit={handleEdit}
                      columnVisibility={columnVisibility}
                    />
                  ) : (
                    <InventoryGrid
                      items={filteredItems}
                      loading={loading}
                      onDelete={handleDeleteClick}
                      onEdit={handleEdit}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AddItemModal onAdd={handleAdd} />

      {editingInventory && (
        <EditItemModal item={editingInventory} onUpdate={handleUpdate} />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Delete Item"
        description={`Are you sure you want to delete item "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
