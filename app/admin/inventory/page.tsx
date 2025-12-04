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
  createBatchInventory,
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
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  X,
  Search,
  Plus,
  Filter,
  Banknote,
  Clock,
  CheckSquare,
  XCircle,
  Eye,
  FileText,
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
import { PDCWithItems } from "@/types/pdc";
import {
  getAllPDCs,
  getPDCStats,
  updatePDCStatus,
  deletePDC,
  getPDCById,
} from "@/action/pdc";
import { PDCDetailsModal } from "@/components/admin/inventory/PDCDetailsModal";
import { PDCTab } from "@/components/admin/inventory/tabs/PDCTab";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type StatusFilter = "all" | "inStock" | "lowStock" | "outOfStock";
type SupplierStatusFilter = "all" | "active" | "inactive" | "pending";
type CategoryFilter = "all" | string;
type ViewMode = "table" | "grid";
type ActiveTab = "analytics" | "materials" | "pdc" | "suppliers";
type PDCStatusFilter = "all" | "pending" | "issued" | "cancelled";

interface CategoryData {
  category: string;
  items: {
    name: string;
    quantity: number;
    reorderPoint: number;
  }[];
}

// Main component wrapped with Suspense
export default function MainInventory() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen font-geist">
          <div className="flex-shrink-0 bg-white border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1 mb-4 px-5 pt-5">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
            <div className="flex border-b border-gray-200 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      }
    >
      <MainInventoryContent />
    </Suspense>
  );
}

// Inner component that uses useSearchParams
function MainInventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<IInventory[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [pdcs, setPdcs] = useState<PDCWithItems[]>([]);
  const [pdcStats, setPdcStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [pdcsLoading, setPdcsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [pdcSearchTerm, setPdcSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [supplierStatusFilter, setSupplierStatusFilter] =
    useState<SupplierStatusFilter>("all");
  const [pdcStatusFilter, setPdcStatusFilter] =
    useState<PDCStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSupplierFilterOpen, setIsSupplierFilterOpen] = useState(false);
  const [isPDCFilterOpen, setIsPDCFilterOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IInventory | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<ISupplier | null>(
    null
  );
  const [pdcToDelete, setPdcToDelete] = useState<PDCWithItems | null>(null);
  const [selectedPDC, setSelectedPDC] = useState<PDCWithItems | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSupplierDeleteModalOpen, setIsSupplierDeleteModalOpen] =
    useState(false);
  const [isPDCDeleteModalOpen, setIsPDCDeleteModalOpen] = useState(false);
  const [isPDCDetailsOpen, setIsPDCDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedItem, setSelectedItem] = useState<IInventory | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    name: true,
    category: true,
    quantity: true,
    unit: true,
    unitCost: true,
    salePrice: true,
    totalCapital: true,
    totalValue: true,
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
  const [pdcCurrentPage, setPdcCurrentPage] = useState(1);
  const [pdcItemsPerPage, setPdcItemsPerPage] = useState(10);

  // Chart data states
  const [chartData, setChartData] = useState<CategoryData[]>([]);
  const [chartCategories, setChartCategories] = useState<string[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  // Get active tab from URL or default to "materials"
  const getActiveTabFromURL = (): ActiveTab => {
    const tab = searchParams.get("tab") as ActiveTab;
    return tab && ["analytics", "materials", "pdc", "suppliers"].includes(tab)
      ? tab
      : "materials";
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(getActiveTabFromURL);

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

  // Update URL when tab changes
  const updateURL = useCallback(
    (tab: ActiveTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Handle tab change
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    updateURL(tab);
  };

  // Sync URL with state on initial load
  useEffect(() => {
    const tabFromURL = getActiveTabFromURL();
    if (tabFromURL !== activeTab) {
      setActiveTab(tabFromURL);
    }
  }, [searchParams]);

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

  // Fetch PDCs when PDC tab is active
  useEffect(() => {
    const fetchPDCs = async () => {
      if (activeTab === "pdc") {
        setPdcsLoading(true);
        try {
          const [pdcsResult, statsResult] = await Promise.all([
            getAllPDCs(),
            getPDCStats(),
          ]);
          if (pdcsResult.success && pdcsResult.pdcs) {
            setPdcs(pdcsResult.pdcs);
          }
          if (statsResult.success && statsResult.stats) {
            setPdcStats(statsResult.stats);
          }
        } catch (error) {
          console.error("Failed to fetch PDCs:", error);
          toast.error("Failed to fetch PDC records");
        } finally {
          setPdcsLoading(false);
        }
      }
    };
    fetchPDCs();
  }, [activeTab]);

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
        item.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Filter PDCs based on search term and filters
  const filteredPDCs = pdcs.filter((pdc) => {
    // Search filter
    if (
      pdcSearchTerm &&
      !(
        (pdc.checkNumber || "")
          .toLowerCase()
          .includes(pdcSearchTerm.toLowerCase()) ||
        pdc.supplier.toLowerCase().includes(pdcSearchTerm.toLowerCase()) ||
        pdc.payee.toLowerCase().includes(pdcSearchTerm.toLowerCase())
      )
    ) {
      return false;
    }
    // Status filter
    if (pdcStatusFilter !== "all" && pdc.status !== pdcStatusFilter) {
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
    totalCapital: filteredItems.reduce(
      (total, item) =>
        total + (item.totalCapital || item.quantity * (item.unitCost || 0)),
      0
    ),
    totalValue: filteredItems.reduce(
      (total, item) =>
        total + (item.totalValue || item.quantity * (item.salePrice || 0)),
      0
    ),
    categoryStats: Array.from(
      filteredItems.reduce((acc, item) => {
        const category = item.category || "Uncategorized";
        const current = acc.get(category) || {
          count: 0,
          totalCapital: 0,
          totalValue: 0,
        };
        current.count += 1;
        current.totalCapital +=
          item.totalCapital || item.quantity * (item.unitCost || 0);
        current.totalValue +=
          item.totalValue || item.quantity * (item.salePrice || 0);
        acc.set(category, current);
        return acc;
      }, new Map())
    ).map(([category, data]) => ({
      category,
      count: data.count,
      totalCapital: data.totalCapital,
      totalValue: data.totalValue,
    })),
  };

  const hasActiveFilters =
    !!searchTerm || statusFilter !== "all" || categoryFilter !== "all";
  const hasSupplierActiveFilters =
    !!supplierSearchTerm || supplierStatusFilter !== "all";
  const hasPDCActiveFilters = !!pdcSearchTerm || pdcStatusFilter !== "all";

  // Reset to first page when filters change for materials
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, filteredItems.length]);

  // Reset to first page when filters change for suppliers
  useEffect(() => {
    setSupplierCurrentPage(1);
  }, [supplierSearchTerm, supplierStatusFilter, filteredSuppliers.length]);

  // Reset to first page when filters change for PDCs
  useEffect(() => {
    setPdcCurrentPage(1);
  }, [pdcSearchTerm, pdcStatusFilter, filteredPDCs.length]);

  // Add item
  const handleAdd = async (
    newItem: Omit<
      IInventory,
      | "product_id"
      | "timeCreated"
      | "timeUpdated"
      | "lastUpdated"
      | "createdAt"
      | "totalCapital"
      | "totalValue"
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

  // Add batch items
  const handleBatchAdd = async (
    items: Omit<
      IInventory,
      | "product_id"
      | "timeCreated"
      | "timeUpdated"
      | "lastUpdated"
      | "createdAt"
      | "totalCapital"
      | "totalValue"
    >[]
  ) => {
    try {
      const result = await createBatchInventory(items);
      if (result.success && result.items) {
        setItems((prev) => [...prev, ...result.items]);
        setIsCreateProjectOpen(false);
        toast.success(`Successfully added ${result.count} items`);
        // Invalidate chart data cache when new items are added
        setChartData([]);
      } else {
        toast.error(result.error || "Failed to add items");
      }
    } catch (error) {
      toast.error("Failed to add items");
      console.error("Error creating batch items:", error);
    }
  };

  // Edit item
  const handleEdit = (item: IInventory) => {
    setIsEditInventoryOpen(true, item);
  };

  // Update item
  const handleUpdate = async (
    product_id: string,
    data: Partial<
      Omit<
        IInventory,
        | "product_id"
        | "timeCreated"
        | "timeUpdated"
        | "lastUpdated"
        | "createdAt"
        | "totalCapital"
        | "totalValue"
      >
    >
  ) => {
    try {
      const result = await updateInventory(product_id, data);
      if (result.success && result.item) {
        setItems((prev) =>
          prev.map((item) =>
            item.product_id === product_id ? result.item : item
          )
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

  // Delete item using product_id
  const handleDelete = async (product_id: string) => {
    try {
      const result = await deleteInventory(product_id);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.product_id !== product_id));
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
  // Export to PDF using the PDF formatter with filtered results
  const handleExportPDF = async () => {
    try {
      const { exportToPDF } = PDFFormatter({
        inventoryItems: filteredItems, // This is the key change - using filteredItems instead of items
        categoryStats: inventoryStats.categoryStats,
        totalItems: inventoryStats.total,
        inStockCount: inventoryStats.inStock,
        restockNeededCount: inventoryStats.restockNeeded,
        totalCapital: inventoryStats.totalCapital,
        totalValue: inventoryStats.totalValue,
      });
      await exportToPDF();
      toast.success("Inventory report exported to PDF");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  // PDC Functions
  const handleViewPDCDetails = async (pdc: PDCWithItems) => {
    setSelectedPDC(pdc);
    setIsPDCDetailsOpen(true);
  };

  const handlePDCDetailsClose = () => {
    setIsPDCDetailsOpen(false);
    setSelectedPDC(null);
  };

  const handleMarkAsIssued = async (pdc_id: string) => {
    try {
      const result = await updatePDCStatus(pdc_id, { status: "issued" });
      if (result.success) {
        toast.success("PDC marked as issued");
        // Refresh PDCs
        const pdcsResult = await getAllPDCs();
        if (pdcsResult.success && pdcsResult.pdcs) {
          setPdcs(pdcsResult.pdcs);
        }
      } else {
        toast.error(result.error || "Failed to update PDC status");
      }
    } catch (error) {
      toast.error("Failed to update PDC status");
      console.error("Error updating PDC:", error);
    }
  };

  const handlePDCDeleteClick = (pdc: PDCWithItems) => {
    setPdcToDelete(pdc);
    setIsPDCDeleteModalOpen(true);
  };

  const handlePDCDeleteConfirm = async () => {
    if (!pdcToDelete) return;
    try {
      const result = await deletePDC(pdcToDelete.pdc_id);
      if (result.success) {
        toast.success("PDC deleted successfully");
        // Refresh PDCs
        const pdcsResult = await getAllPDCs();
        if (pdcsResult.success && pdcsResult.pdcs) {
          setPdcs(pdcsResult.pdcs);
        }
      } else {
        toast.error(result.error || "Failed to delete PDC");
      }
    } catch (error) {
      toast.error("Failed to delete PDC");
      console.error("Error deleting PDC:", error);
    } finally {
      setIsPDCDeleteModalOpen(false);
      setPdcToDelete(null);
    }
  };

  const handlePDCDeleteCancel = () => {
    setIsPDCDeleteModalOpen(false);
    setPdcToDelete(null);
  };

  const handleDeleteClick = (item: IInventory) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    await handleDelete(itemToDelete.product_id);
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

  const clearPDCFilters = () => {
    setPdcSearchTerm("");
    setPdcStatusFilter("all");
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
    if (quantity === 0) {
      return { text: "Out of Stock", variant: "destructive" as const };
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
                ₱{inventoryStats.totalValue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Inventory worth</p>
            </CardContent>
          </Card>
        </div>
        {/* Additional Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Total Capital</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                ₱{inventoryStats.totalCapital.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">
                Total investment in inventory
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Potential Profit</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                ₱
                {(
                  inventoryStats.totalValue - inventoryStats.totalCapital
                ).toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Total value minus capital</p>
            </CardContent>
          </Card>
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
        return (
          <PDCTab
            pdcs={pdcs}
            pdcStats={pdcStats}
            pdcsLoading={pdcsLoading}
            pdcSearchTerm={pdcSearchTerm}
            setPdcSearchTerm={setPdcSearchTerm}
            pdcStatusFilter={pdcStatusFilter}
            setPdcStatusFilter={setPdcStatusFilter}
            isPDCFilterOpen={isPDCFilterOpen}
            setIsPDCFilterOpen={setIsPDCFilterOpen}
            hasPDCActiveFilters={hasPDCActiveFilters}
            pdcCurrentPage={pdcCurrentPage}
            pdcItemsPerPage={pdcItemsPerPage}
            filteredPDCs={filteredPDCs}
            onViewPDCDetails={handleViewPDCDetails}
            onMarkAsIssued={handleMarkAsIssued}
            onPDCDeleteClick={handlePDCDeleteClick}
            onClearPDCFilters={clearPDCFilters}
            setPdcCurrentPage={setPdcCurrentPage}
          />
        );
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
              Manage your Inventory
            </h1>
            <p className="text-gray-600 mt-1 text-sm font-geist">
              Manage and track all inventory items and suppliers.
            </p>
          </div>
        </div>
        {/* Tabs Navigation - Transaction Page Style */}
        <div className="flex border-b border-gray-200 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as ActiveTab)}
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
      <AddItemModal onAdd={handleAdd} onBatchAdd={handleBatchAdd} />
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

      <ConfirmationModal
        isOpen={isPDCDeleteModalOpen}
        onConfirm={handlePDCDeleteConfirm}
        onCancel={handlePDCDeleteCancel}
        title="Delete PDC"
        description={`Are you sure you want to delete PDC "${pdcToDelete?.checkNumber}"? This action cannot be undone.`}
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

      {/* PDC Details Modal - Now using the imported component */}
      {selectedPDC && (
        <PDCDetailsModal
          pdc={selectedPDC}
          isOpen={isPDCDetailsOpen}
          onClose={handlePDCDetailsClose}
          onMarkIssued={handleMarkAsIssued}
        />
      )}
    </div>
  );
}
