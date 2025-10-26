// app/admin/main-inventory/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { IInventory } from "@/types/Inventory";
import { ISupplier } from "@/types/supplier";
import {
  getInventories,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryByCategory,
  getCategories,
} from "@/action/inventory";
import {
  getSuppliers,
  createSupplier,
  deleteSupplier,
} from "@/action/supplier";
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
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  X,
  Search,
  Plus,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Badge } from "@/components/ui/badge";
import { CategoryBarChart } from "@/components/admin/inventory/CategoryBarChart";
import { PDFFormatter } from "@/components/admin/inventory/pdf/Formatter";
import { MaterialsView } from "@/components/admin/inventory/views/MaterialsView";
import { ItemDetailsModal } from "@/components/admin/inventory/details/ItemDetailsModal";
import { AddSupplierModal } from "@/components/admin/supplier/AddSupplierModal";
import { ViewSupplierModal } from "@/components/admin/supplier/ViewSupplierModal";
import { SupplierView } from "@/components/admin/supplier/views/SupplierView";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StatusFilter = "all" | "inStock" | "lowStock" | "outOfStock";
type SupplierStatusFilter = "all" | "active" | "inactive" | "pending";
type CategoryFilter = "all" | string;
type ViewMode = "table" | "grid";
type ActiveTab = "analytics" | "materials" | "pdc" | "suppliers";

interface CategoryData {
  category: string;
  items: {
    name: string;
    quantity: number;
    reorderPoint: number;
    safetyStock?: number;
  }[];
}

export default function MainInventory() {
  const [items, setItems] = useState<IInventory[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [supplierStatusFilter, setSupplierStatusFilter] =
    useState<SupplierStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSupplierFilterOpen, setIsSupplierFilterOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IInventory | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<ISupplier | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSupplierDeleteModalOpen, setIsSupplierDeleteModalOpen] =
    useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeTab, setActiveTab] = useState<ActiveTab>("materials");
  const [selectedItem, setSelectedItem] = useState<IInventory | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [supplierCurrentPage, setSupplierCurrentPage] = useState(1);
  const [supplierItemsPerPage, setSupplierItemsPerPage] = useState(10);

  // Chart data states
  const [chartData, setChartData] = useState<CategoryData[]>([]);
  const [chartCategories, setChartCategories] = useState<string[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  // Extract the modal state from the store
  const {
    isCreateProjectOpen,
    setIsCreateProjectOpen,
    isEditInventoryOpen,
    setIsEditInventoryOpen,
    editingInventory,
    isCreateSupplierOpen,
    setIsCreateSupplierOpen,
    isViewSupplierOpen,
    setIsViewSupplierOpen,
    viewingSupplier,
  } = useModalStore();

  // Fetch items only once on component mount
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

  // Fetch suppliers when suppliers tab is active or on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      setSuppliersLoading(true);
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
        toast.error("Failed to fetch suppliers");
      } finally {
        setSuppliersLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch chart data only once on component mount
  useEffect(() => {
    const fetchChartData = async () => {
      if (chartData.length > 0) return; // Don't fetch if already loaded

      setChartLoading(true);
      try {
        const [categoryData, categoryList] = await Promise.all([
          getInventoryByCategory(),
          getCategories(),
        ]);
        setChartData(categoryData);
        setChartCategories(categoryList);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
        toast.error("Failed to load chart data");
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [chartData.length]); // Only depend on chartData length

  // Get unique categories for filtering
  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean))
  ).sort();

  // Filter items based on search term and filters
  const filteredItems = items.filter((item) => {
    // Search filter
    if (
      searchTerm &&
      !(
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  // Filter suppliers based on search term and filters
  const filteredSuppliers = suppliers.filter((supplier) => {
    // Search filter
    if (
      supplierSearchTerm &&
      !(
        supplier.companyName
          .toLowerCase()
          .includes(supplierSearchTerm.toLowerCase()) ||
        supplier.contactPerson
          .toLowerCase()
          .includes(supplierSearchTerm.toLowerCase()) ||
        supplier.contact.includes(supplierSearchTerm) ||
        (supplier.email &&
          supplier.email
            .toLowerCase()
            .includes(supplierSearchTerm.toLowerCase())) ||
        supplier.location
          .toLowerCase()
          .includes(supplierSearchTerm.toLowerCase()) ||
        supplier.supplier_id
          .toLowerCase()
          .includes(supplierSearchTerm.toLowerCase())
      )
    ) {
      return false;
    }

    // Status filter
    if (
      supplierStatusFilter !== "all" &&
      supplier.status !== supplierStatusFilter
    ) {
      return false;
    }

    return true;
  });

  // Calculate inventory stats - MOVED AFTER filteredItems declaration
  const inventoryStats = {
    inStock: filteredItems.filter((item) => item.quantity > 0).length,
    lowStock: filteredItems.filter(
      (item) => item.quantity > 0 && item.quantity <= item.reorderPoint
    ).length,
    outOfStock: filteredItems.filter((item) => item.quantity === 0).length,
    restockNeeded: filteredItems.filter(
      (item) => item.quantity <= item.reorderPoint
    ).length,
    total: filteredItems.length,
    totalValue: filteredItems.reduce(
      (total, item) => total + item.quantity * (item.unitCost || 0),
      0
    ),
    categoryStats: Array.from(
      filteredItems.reduce((acc, item) => {
        const category = item.category || "Uncategorized";
        const current = acc.get(category) || { count: 0, totalValue: 0 };
        current.count += 1;
        current.totalValue += item.quantity * (item.unitCost || 0);
        acc.set(category, current);
        return acc;
      }, new Map())
    ).map(([category, data]) => ({
      category,
      count: data.count,
      totalValue: data.totalValue,
    })),
  };

  const hasActiveFilters =
    !!searchTerm || statusFilter !== "all" || categoryFilter !== "all";

  const hasSupplierActiveFilters =
    !!supplierSearchTerm || supplierStatusFilter !== "all";

  // Reset to first page when filters change for materials
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, filteredItems.length]);

  // Reset to first page when filters change for suppliers
  useEffect(() => {
    setSupplierCurrentPage(1);
  }, [supplierSearchTerm, supplierStatusFilter, filteredSuppliers.length]);

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

        // Invalidate chart data cache when new item is added
        setChartData([]);
      } else {
        toast.error(result.error || "Failed to add item");
      }
    } catch (error) {
      toast.error("Failed to add item");
      console.error("Error creating item:", error);
    }
  };

  // Edit item
  const handleEdit = (item: IInventory) => {
    setIsEditInventoryOpen(true, item);
  };

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

        // Invalidate chart data cache when item is updated
        setChartData([]);
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

        // Invalidate chart data cache when item is deleted
        setChartData([]);
      } else {
        toast.error(result.error || "Failed to delete item");
      }
    } catch (error) {
      toast.error("Failed to delete item");
      console.error("Error deleting item:", error);
    }
  };

  // Add supplier
  const handleAddSupplier = async (newSupplier: any) => {
    try {
      const result = await createSupplier(newSupplier);
      if (result.success && result.supplier) {
        setSuppliers((prev) => [...prev, result.supplier!]);
        setIsCreateSupplierOpen(false);
        toast.success("Supplier added successfully");
      } else {
        toast.error(result.error || "Failed to add supplier");
      }
    } catch (error) {
      toast.error("Failed to add supplier");
      console.error("Error creating supplier:", error);
    }
  };

  // Delete supplier
  const handleDeleteSupplier = async (supplier_id: string) => {
    try {
      const result = await deleteSupplier(supplier_id);
      if (result.success) {
        setSuppliers((prev) =>
          prev.filter((s) => s.supplier_id !== supplier_id)
        );
        toast.success("Supplier deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete supplier");
      }
    } catch (error) {
      toast.error("Failed to delete supplier");
      console.error("Error deleting supplier:", error);
    }
  };

  // View supplier details
  const handleViewSupplier = (supplier: ISupplier) => {
    setIsViewSupplierOpen(true, supplier);
  };

  // View item details
  const handleViewDetails = (item: IInventory) => {
    setSelectedItem(item);
    setIsViewDetailsOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsViewDetailsOpen(false);
    setSelectedItem(null);
  };

  // Export to PDF using the PDF formatter
  const handleExportPDF = async () => {
    try {
      const { exportToPDF } = PDFFormatter({
        inventoryItems: filteredItems,
        categoryStats: inventoryStats.categoryStats,
        totalItems: inventoryStats.total,
        inStockCount: inventoryStats.inStock,
        restockNeededCount: inventoryStats.restockNeeded,
      });

      await exportToPDF();
      toast.success("Inventory report exported to PDF");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleDeleteClick = (item: IInventory) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    await handleDelete(itemToDelete.item_id);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleSupplierDeleteClick = (supplier: ISupplier) => {
    setSupplierToDelete(supplier);
    setIsSupplierDeleteModalOpen(true);
  };

  const handleSupplierDeleteConfirm = async () => {
    if (!supplierToDelete) return;
    await handleDeleteSupplier(supplierToDelete.supplier_id);
    setIsSupplierDeleteModalOpen(false);
    setSupplierToDelete(null);
  };

  const handleSupplierDeleteCancel = () => {
    setIsSupplierDeleteModalOpen(false);
    setSupplierToDelete(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  const clearSupplierFilters = () => {
    setSupplierSearchTerm("");
    setSupplierStatusFilter("all");
  };

  const handleAddItem = () => {
    setIsCreateProjectOpen(true);
  };

  const handleAddSupplierClick = () => {
    setIsCreateSupplierOpen(true);
  };

  // Get status information for an item
  const getStatusInfo = (item: IInventory) => {
    const quantity = item.quantity;
    const reorderPoint = item.reorderPoint ?? 0;
    const safetyStock = item.safetyStock ?? 0;

    if (quantity === 0) {
      return { text: "Out of Stock", variant: "destructive" as const };
    }
    if (quantity <= safetyStock) {
      return { text: "Critical", variant: "destructive" as const };
    }
    if (quantity <= reorderPoint) {
      return { text: "Low Stock", variant: "secondary" as const };
    }
    return { text: "In Stock", variant: "default" as const };
  };

  const AnalyticsTab = () => (
    <Card className="w-full rounded-sm shadow-none border">
      <CardHeader>
        <CardTitle className="text-foreground-900 font-geist">
          Inventory Analytics
        </CardTitle>
        <CardDescription className="font-geist">
          Comprehensive overview of your inventory performance and trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <CategoryBarChart
            categoryData={chartData}
            categories={chartCategories}
            loading={chartLoading}
          />
        </div>

        {/* Additional Analytics Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">In Stock</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {inventoryStats.inStock}
              </p>
              <p className="text-xs text-gray-600">Items available</p>
            </CardContent>
          </Card>

          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">Low Stock</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {inventoryStats.lowStock}
              </p>
              <p className="text-xs text-gray-600">Need attention</p>
            </CardContent>
          </Card>

          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">Out of Stock</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {inventoryStats.outOfStock}
              </p>
              <p className="text-xs text-gray-600">Require restocking</p>
            </CardContent>
          </Card>

          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Total Value</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                ${inventoryStats.totalValue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Inventory worth</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );

  const PDCTab = () => (
    <Card className="w-full rounded-none shadow-none border-none">
      <CardHeader>
        <CardTitle className="text-foreground-900 font-geist">
          Production & Distribution Center (PDC)
        </CardTitle>
        <CardDescription className="font-geist">
          Manage production planning, distribution, and supply chain operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-12">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 font-geist mb-2">
            PDC Module Coming Soon
          </h3>
          <p className="text-gray-600 font-geist max-w-md mx-auto">
            Production and Distribution Center features are currently under
            development. This module will include production planning,
            distribution tracking, and supply chain management capabilities.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const tabs = [
    { id: "analytics", label: "Analytics" },
    { id: "materials", label: "Materials" },
    { id: "suppliers", label: "Suppliers" },
    { id: "pdc", label: "PDC" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "analytics":
        return <AnalyticsTab />;
      case "materials":
        return (
          <MaterialsView
            items={items}
            filteredItems={filteredItems}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            viewMode={viewMode}
            setViewMode={setViewMode}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            categories={categories}
            hasActiveFilters={hasActiveFilters}
            onAddItem={handleAddItem}
            onEditItem={handleEdit}
            onDeleteItem={handleDeleteClick}
            onViewDetails={handleViewDetails}
            onExportPDF={handleExportPDF}
            onClearFilters={clearFilters}
            // Pagination props
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
          />
        );
      case "pdc":
        return <PDCTab />;
      case "suppliers":
        return (
          <SupplierView
            suppliers={suppliers}
            filteredSuppliers={filteredSuppliers}
            loading={suppliersLoading}
            searchTerm={supplierSearchTerm}
            setSearchTerm={setSupplierSearchTerm}
            statusFilter={supplierStatusFilter}
            setStatusFilter={setSupplierStatusFilter}
            isFilterOpen={isSupplierFilterOpen}
            setIsFilterOpen={setIsSupplierFilterOpen}
            hasActiveFilters={hasSupplierActiveFilters}
            onAddSupplier={handleAddSupplierClick}
            onDeleteSupplier={handleSupplierDeleteClick}
            onViewSupplier={handleViewSupplier}
            onClearFilters={clearSupplierFilters}
            // Pagination props
            currentPage={supplierCurrentPage}
            setCurrentPage={setSupplierCurrentPage}
            itemsPerPage={supplierItemsPerPage}
            setItemsPerPage={setSupplierItemsPerPage}
          />
        );
      default:
        return (
          <MaterialsView
            items={items}
            filteredItems={filteredItems}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            viewMode={viewMode}
            setViewMode={setViewMode}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            categories={categories}
            hasActiveFilters={hasActiveFilters}
            onAddItem={handleAddItem}
            onEditItem={handleEdit}
            onDeleteItem={handleDeleteClick}
            onViewDetails={handleViewDetails}
            onExportPDF={handleExportPDF}
            onClearFilters={clearFilters}
            // Pagination props
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-geist">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 bg-white border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1 mb-4 px-5 pt-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground font-geist">
              Inventory Management
            </h1>
            <p className="text-gray-600 mt-1 text-sm font-geist">
              Manage and track all inventory items and suppliers in your system
            </p>
          </div>
        </div>

        {/* Tabs Navigation - Transaction Page Style */}
        <div className="flex border-b border-gray-200 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 font-geist ${
                activeTab === tab.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">{renderTabContent()}</div>
      </div>

      {/* Modals */}
      <AddItemModal onAdd={handleAdd} />
      <AddSupplierModal onAdd={handleAddSupplier} />

      {editingInventory && (
        <EditItemModal item={editingInventory} onUpdate={handleUpdate} />
      )}

      {/* View Supplier Modal */}
      {viewingSupplier && (
        <ViewSupplierModal
          supplier={viewingSupplier}
          onDelete={handleSupplierDeleteClick}
        />
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

      <ConfirmationModal
        isOpen={isSupplierDeleteModalOpen}
        onConfirm={handleSupplierDeleteConfirm}
        onCancel={handleSupplierDeleteCancel}
        title="Delete Supplier"
        description={`Are you sure you want to delete supplier "${supplierToDelete?.companyName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* View Details Modal - Using the new full-screen modal */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          isOpen={isViewDetailsOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
