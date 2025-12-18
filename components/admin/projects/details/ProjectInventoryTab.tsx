// components/projects/ProjectInventoryTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getProjectInventory,
  getRecentProjectActions,
  getCurrentProjectInventory,
} from "@/action/project-inventory";
import { getInventories } from "@/action/inventory";
import { IInventory } from "@/types/Inventory";
import {
  ProjectInventoryRecord,
  CurrentInventoryItem as ServerCurrentInventoryItem,
} from "@/types/project-inventory";
import { useAuthStore } from "@/lib/stores";

// Import tab components
import CurrentInventoryTab from "./inventorytabs/CurrentInventoryTab";
import TransactionsTab from "./inventorytabs/TransactionTab";

// Import shared components
import { StatisticsCards } from "./inventorytabs/StatisticsCards";
import { DetailsDialog } from "./inventorytabs/DetailsDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, List, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Interfaces
interface ProjectInventoryTabProps {
  projectId: string;
}

interface InventorySummary {
  product_id: string;
  quantity: number;
  item?: IInventory;
  totalValue?: number;
  totalCost?: number;
}

// Extended interface that includes all properties we need
interface CurrentInventoryItem {
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

export default function ProjectInventoryTab({
  projectId,
}: ProjectInventoryTabProps) {
  // Get user from auth store
  const { user: authUser } = useAuthStore();

  // State
  const [records, setRecords] = useState<ProjectInventoryRecord[]>([]);
  const [summary, setSummary] = useState<InventorySummary[]>([]);
  const [currentInventory, setCurrentInventory] = useState<
    CurrentInventoryItem[]
  >([]);
  const [recentActions, setRecentActions] = useState<ProjectInventoryRecord[]>(
    []
  );
  const [inventoryItems, setInventoryItems] = useState<Map<string, IInventory>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"transactions" | "current">(
    "current"
  );
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [viewDetails, setViewDetails] = useState<ProjectInventoryRecord | null>(
    null
  );

  // Effects
  useEffect(() => {
    fetchAllData();
  }, [projectId]);

  useEffect(() => {
    if (records.length > 0) {
      fetchInventoryDetails();
    }
  }, [records]);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [inventoryResult, actionsResult, currentInventoryResult] =
        await Promise.all([
          getProjectInventory(projectId),
          getRecentProjectActions(projectId, 5),
          getCurrentProjectInventory(projectId),
        ]);

      if (inventoryResult.success && inventoryResult.records) {
        setRecords(inventoryResult.records);
      } else {
        setError(inventoryResult.error || "Failed to load inventory records");
      }

      if (actionsResult.success && actionsResult.actions) {
        setRecentActions(actionsResult.actions);
      }

      // USE THE SERVER'S CURRENT INVENTORY DATA
      if (currentInventoryResult.success && currentInventoryResult.items) {
        console.log(
          "Server current inventory data:",
          currentInventoryResult.items
        );
        const serverCurrentInventory = currentInventoryResult.items.map(
          convertServerItemToComponentItem
        );
        setCurrentInventory(serverCurrentInventory);

        // Also update summary with server data
        const summaryFromServer = serverCurrentInventory.map((item) => ({
          product_id: item.product_id,
          quantity: item.currentQuantity,
          item: inventoryItems.get(item.product_id),
          totalValue: item.totalValue,
          totalCost: item.totalCost,
        }));
        setSummary(summaryFromServer);
      } else {
        console.warn(
          "No current inventory from server, using transaction-based calculation"
        );
        calculateSummary(inventoryResult.records || []);

        // Fallback to transaction-based calculation for current inventory
        const fallbackCurrentInventory =
          await calculateCurrentInventoryFromRecords(
            inventoryResult.records || [],
            inventoryItems
          );
        setCurrentInventory(fallbackCurrentInventory);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load project inventory";
      setError(errorMessage);
      toast.error("Failed to load project inventory");
      console.error("Error loading project inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert server item to component item
  const convertServerItemToComponentItem = (
    serverItem: ServerCurrentInventoryItem
  ): CurrentInventoryItem => {
    const inventoryItem = inventoryItems.get(serverItem.product_id);

    // Use projectReorderPoint for low stock calculation - allow null
    const projectReorderPoint = serverItem.projectReorderPoint;
    const currentQuantity = Math.max(0, serverItem.currentQuantity || 0);

    // Only use project reorder point for low stock calculation
    // If no project reorder point is set, don't calculate low stock
    const isLowStock =
      projectReorderPoint !== undefined
        ? currentQuantity <= (projectReorderPoint || 0)
        : false;

    return {
      product_id: serverItem.product_id,
      name: serverItem.name || serverItem.product_id,
      category: serverItem.category || "Uncategorized",
      unit: serverItem.unit || "units",
      currentQuantity,
      totalTransferredIn:
        serverItem.totalTransferredIn || serverItem.totalCheckedOut || 0,
      totalReturnedOut:
        serverItem.totalReturnedOut || serverItem.totalReturned || 0,
      totalAdjusted: serverItem.totalAdjusted || 0,
      action: serverItem.action || "adjusted",
      unitCost: serverItem.unitCost || 0,
      totalCost: serverItem.totalCost || 0,
      salePrice: serverItem.salePrice,
      totalValue: serverItem.totalValue || serverItem.totalCost || 0,
      supplier: serverItem.supplier || "Gian Construction",
      location: serverItem.location,
      projectReorderPoint: serverItem.projectReorderPoint,
      isLowStock,
      profitMargin: serverItem.profitMargin || 0,
      lastTransaction: serverItem.lastTransaction,
      lastProjectInventoryId: serverItem.lastProjectInventoryId,
      totalCheckedOut: serverItem.totalCheckedOut,
      totalReturned: serverItem.totalReturned,
    };
  };

  // Fallback function to calculate current inventory from records
  const calculateCurrentInventoryFromRecords = async (
    records: ProjectInventoryRecord[],
    inventoryMap: Map<string, IInventory>
  ): Promise<CurrentInventoryItem[]> => {
    if (records.length === 0) return [];

    const inventoryByProduct = new Map<string, CurrentInventoryItem>();

    // First pass: calculate current quantity and total value
    records.forEach((record) => {
      if (!record.product_id || record.product_id.trim() === "") return;

      const inventoryItem = inventoryMap.get(record.product_id);
      if (!inventoryItem) return;

      let currentItem = inventoryByProduct.get(record.product_id);
      if (!currentItem) {
        currentItem = {
          product_id: record.product_id,
          name: inventoryItem.name || record.product_id,
          category: inventoryItem.category || "Uncategorized",
          unit: inventoryItem.unit || "units",
          currentQuantity: 0,
          totalTransferredIn: 0,
          totalReturnedOut: 0,
          totalAdjusted: 0,
          action: "adjusted",
          unitCost: inventoryItem.unitCost || 0,
          totalCost: 0,
          salePrice: inventoryItem.salePrice || 0,
          totalValue: 0,
          supplier: inventoryItem.supplier || "Gian Construction",
          location: inventoryItem.location,
          projectReorderPoint: undefined,
          isLowStock: false,
          profitMargin: 0,
          lastTransaction: record.createdAt,
          lastProjectInventoryId: record.projectInventory_id,
        };
        inventoryByProduct.set(record.product_id, currentItem);
      }

      // Track projectReorderPoint from the most recent checkout record
      if (
        record.action === "checked_out" &&
        record.projectReorderPoint !== undefined
      ) {
        // Use the latest projectReorderPoint from checkout records
        const recordDate = new Date(record.createdAt);
        const currentDate = currentItem.lastTransaction
          ? new Date(currentItem.lastTransaction)
          : new Date(0);

        if (
          recordDate > currentDate ||
          currentItem.projectReorderPoint === undefined
        ) {
          currentItem.projectReorderPoint = record.projectReorderPoint;
        }
      }

      if (record.action === "checked_out") {
        currentItem.totalTransferredIn += record.quantity;
        currentItem.currentQuantity += record.quantity;
        const transactionValue =
          record.totalValue ||
          (record.salePrice || inventoryItem.salePrice || 0) * record.quantity;
        currentItem.totalValue =
          (currentItem.totalValue || 0) + transactionValue;
      } else if (record.action === "returned") {
        currentItem.totalReturnedOut += record.quantity;
        currentItem.currentQuantity = Math.max(
          0,
          currentItem.currentQuantity - record.quantity
        );
        const transactionValue =
          record.totalValue ||
          (record.salePrice || inventoryItem.salePrice || 0) * record.quantity;
        currentItem.totalValue = Math.max(
          0,
          (currentItem.totalValue || 0) - transactionValue
        );
      } else if (record.action === "adjusted") {
        currentItem.totalAdjusted =
          (currentItem.totalAdjusted || 0) + record.quantity;
        currentItem.currentQuantity = Math.max(
          0,
          currentItem.currentQuantity - record.quantity
        );
        // DO NOT adjust totalValue for adjusted actions
      }

      // Update last transaction info
      if (record.createdAt) {
        const recordDate = new Date(record.createdAt);
        const currentDate = currentItem.lastTransaction
          ? new Date(currentItem.lastTransaction)
          : new Date(0);
        if (recordDate > currentDate) {
          currentItem.lastTransaction = record.createdAt;
          currentItem.lastProjectInventoryId = record.projectInventory_id;
        }
      }

      inventoryByProduct.set(record.product_id, currentItem);
    });

    // Second pass: calculate final costs and low stock status
    const result = Array.from(inventoryByProduct.values()).map((item) => {
      const inventoryItem = inventoryMap.get(item.product_id);
      const unitPrice =
        item.salePrice && item.salePrice > 0 ? item.salePrice : item.unitCost;

      // Calculate total cost based on current quantity (for display)
      const totalCost = Math.max(0, item.currentQuantity) * unitPrice;

      // Use the calculated totalValue for financial reporting
      const finalTotalValue = Math.max(0, item.totalValue || 0);

      // Only calculate low stock if project reorder point is set
      const isLowStock =
        item.projectReorderPoint !== undefined
          ? item.currentQuantity <= (item.projectReorderPoint || 0)
          : false;

      return {
        ...item,
        totalCost,
        totalValue: finalTotalValue,
        projectReorderPoint: item.projectReorderPoint,
        isLowStock,
      };
    });

    return result.filter(
      (item) =>
        item.currentQuantity > 0 ||
        item.totalTransferredIn > 0 ||
        item.totalReturnedOut > 0 ||
        (item.totalAdjusted || 0) > 0
    );
  };

  const refreshData = async () => {
    setRefreshLoading(true);
    try {
      await fetchAllData();
      toast.success("Inventory data refreshed");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshLoading(false);
    }
  };

  const fetchInventoryDetails = async () => {
    if (records.length === 0) return;

    const productIds = [...new Set(records.map((record) => record.product_id))];
    const validProductIds = productIds.filter((id) => id && id.trim() !== "");

    if (validProductIds.length === 0) return;

    try {
      const allInventory = await getInventories();
      const inventoryMap = new Map<string, IInventory>();

      allInventory.forEach((item) => {
        if (item.product_id && item.product_id.trim() !== "") {
          inventoryMap.set(item.product_id, item);
        }
      });

      setInventoryItems(inventoryMap);

      // Update summary with inventory details
      setSummary((prev) =>
        prev.map((item) => ({
          ...item,
          item: inventoryMap.get(item.product_id),
        }))
      );
    } catch (error) {
      console.error("Error fetching inventory details:", error);
    }
  };

  const calculateSummary = (records: ProjectInventoryRecord[]) => {
    const summaryMap = new Map<
      string,
      {
        quantity: number;
        totalValue: number;
        totalCost: number;
      }
    >();

    records.forEach((record) => {
      if (!record.product_id || record.product_id.trim() === "") return;

      const current = summaryMap.get(record.product_id) || {
        quantity: 0,
        totalValue: 0,
        totalCost: 0,
      };

      if (record.action === "checked_out") {
        current.quantity += record.quantity;
        current.totalValue += record.totalValue || 0;
        current.totalCost += record.totalValue || 0;
      } else if (record.action === "returned") {
        current.quantity -= record.quantity;
        current.totalValue -= record.totalValue || 0;
        current.totalCost -= record.totalValue || 0;
      }
      // Note: adjusted actions don't affect quantity in summary

      summaryMap.set(record.product_id, current);
    });

    const summaryArray = Array.from(summaryMap.entries())
      .filter(([product_id]) => product_id && product_id.trim() !== "")
      .map(([product_id, data]) => ({
        product_id,
        quantity: Math.max(0, data.quantity),
        totalValue: Math.max(0, data.totalValue),
        totalCost: Math.max(0, data.totalCost),
      }));

    setSummary(summaryArray);
  };

  // Helper functions for child components
  const getActionConfig = (action: string, record?: ProjectInventoryRecord) => {
    const baseConfig = {
      checked_out: {
        label: "Transferred to Project",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "ArrowDownToLine",
        color: "text-emerald-600",
        description: "From main inventory to project",
      },
      returned: {
        label: "Returned to Main",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: "ArrowUpFromLine",
        color: "text-blue-600",
        description: "From project back to main inventory",
      },
      adjusted: {
        label: "Adjusted",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "Settings",
        color: "text-amber-600",
        description: "Quantity adjustment",
      },
    };

    const config = baseConfig[action as keyof typeof baseConfig] || {
      label: action,
      className: "bg-zinc-50 text-zinc-700 border-zinc-200",
      icon: "Package",
      color: "text-zinc-600",
      description: "",
    };

    // Add projectReorderPoint info if available and it's a checkout action
    if (
      record &&
      record.action === "checked_out" &&
      record.projectReorderPoint !== undefined &&
      record.projectReorderPoint !== null &&
      record.projectReorderPoint > 0
    ) {
      return {
        ...config,
        description: `${config.description} • Project reorder point: ${record.projectReorderPoint}`,
      };
    }

    return config;
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatTime = (date: string) => {
    try {
      return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Invalid time";
    }
  };

  // Calculate statistics for cards
  const totalItems = currentInventory.length;
  const totalQuantity = currentInventory.reduce(
    (sum, item) => sum + Math.max(0, item.currentQuantity),
    0
  );
  const totalCost = currentInventory.reduce(
    (sum, item) => sum + Math.max(0, item.totalCost || 0),
    0
  );
  const totalTransferred = currentInventory.reduce(
    (sum, item) => sum + Math.max(0, item.totalTransferredIn || 0),
    0
  );
  const totalReturned = currentInventory.reduce(
    (sum, item) => sum + Math.max(0, item.totalReturnedOut || 0),
    0
  );

  // Calculate low stock items based ONLY on project reorder point
  const lowStockItems = currentInventory.filter((item) => {
    return (
      item.projectReorderPoint !== undefined &&
      item.projectReorderPoint !== null &&
      item.currentQuantity <= item.projectReorderPoint
    );
  }).length;

  const outOfStockItems = currentInventory.filter(
    (item) => item.currentQuantity === 0
  ).length;

  // Prepare user data for CurrentInventoryTab
  const userData = authUser
    ? {
        user_id: authUser.user_id,
        name:
          `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() ||
          authUser.email,
        role: authUser.role,
      }
    : {
        user_id: "guest-user",
        name: "Guest User",
        role: "guest",
      };

  // CSV Export function
  const handleExportCSV = async (
    type: "transactions" | "inventory" | "summary"
  ) => {
    try {
      let headers: string[] = [];
      let csvData: any[][] = [];

      if (type === "transactions") {
        headers = [
          "Transaction ID",
          "Product ID",
          "Item Name",
          "Action",
          "Quantity",
          "Unit",
          "Sale Price",
          "Total Cost",
          "Project Reorder Point",
          "Supplier",
          "Action By",
          "Role",
          "Date & Time",
          "Notes",
        ];

        csvData = records.map((record) => {
          const item = inventoryItems.get(record.product_id);
          const salePrice = record.salePrice || 0;
          const totalCost = salePrice * record.quantity;

          return [
            record.projectInventory_id || "",
            record.product_id || "",
            item?.name || record.product_id,
            getActionConfig(record.action, record).label,
            record.quantity,
            record.unit || "",
            `₱${salePrice.toLocaleString()}`,
            `₱${totalCost.toLocaleString()}`,
            record.projectReorderPoint !== undefined &&
            record.projectReorderPoint !== null
              ? record.projectReorderPoint
              : "Not set",
            record.supplier || "Gian Construction",
            record.action_by.name || "",
            record.action_by.role || "",
            formatDate(record.createdAt),
            record.notes || "",
          ];
        });
      } else if (type === "inventory") {
        headers = [
          "Product ID",
          "Item Name",
          "Category",
          "Current Quantity",
          "Unit",
          "Total Transferred In",
          "Total Returned Out",
          "Total Adjusted",
          "Project Reorder Point",
          "Sale Price",
          "Total Cost",
          "Supplier",
          "Location",
          "Stock Status",
          "Last Transaction ID",
          "Last Transaction Date",
        ];

        csvData = currentInventory.map((item) => {
          const inventoryItem = inventoryItems.get(item.product_id);
          const unitPrice =
            item.salePrice && item.salePrice > 0
              ? item.salePrice
              : item.unitCost;

          // Only show low stock if project reorder point is set
          const isLowStock =
            item.projectReorderPoint !== undefined &&
            item.projectReorderPoint !== null
              ? item.currentQuantity <= item.projectReorderPoint
              : false;

          return [
            item.product_id,
            item.name,
            item.category,
            item.currentQuantity,
            item.unit,
            item.totalTransferredIn || 0,
            item.totalReturnedOut || 0,
            item.totalAdjusted || 0,
            item.projectReorderPoint !== undefined &&
            item.projectReorderPoint !== null
              ? item.projectReorderPoint
              : "Not set",
            `₱${unitPrice.toLocaleString()}`,
            `₱${item.totalCost.toLocaleString()}`,
            item.supplier,
            item.location || "N/A",
            isLowStock
              ? "Low Stock"
              : item.currentQuantity === 0
                ? "Out of Stock"
                : "In Stock",
            item.lastProjectInventoryId || "N/A",
            item.lastTransaction ? formatDate(item.lastTransaction) : "N/A",
          ];
        });
      } else if (type === "summary") {
        headers = [
          "Category",
          "Number of Items",
          "Total Quantity",
          "Total Cost",
          "Low Stock Items",
          "Items with Project Reorder",
        ];

        csvData = currentInventory
          .reduce((acc: any[], item) => {
            const existingCategory = acc.find((c) => c[0] === item.category);
            if (existingCategory) {
              existingCategory[1] += 1;
              existingCategory[2] += item.currentQuantity;
              existingCategory[3] += item.totalCost || 0;
              existingCategory[4] +=
                item.projectReorderPoint !== undefined &&
                item.projectReorderPoint !== null &&
                item.currentQuantity <= item.projectReorderPoint
                  ? 1
                  : 0;
              existingCategory[5] +=
                item.projectReorderPoint !== undefined &&
                item.projectReorderPoint !== null
                  ? 1
                  : 0;
            } else {
              acc.push([
                item.category,
                1,
                item.currentQuantity,
                item.totalCost || 0,
                item.projectReorderPoint !== undefined &&
                item.projectReorderPoint !== null &&
                item.currentQuantity <= item.projectReorderPoint
                  ? 1
                  : 0,
                item.projectReorderPoint !== undefined &&
                item.projectReorderPoint !== null
                  ? 1
                  : 0,
              ]);
            }
            return acc;
          }, [])
          .map((category) => [
            category[0],
            category[1],
            category[2],
            `₱${category[3].toLocaleString()}`,
            category[4],
            category[5],
          ]);
      }

      const csvContent = [
        headers.join(","),
        ...csvData.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-inventory-${type}-${projectId}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} CSV exported successfully`
      );
    } catch (error) {
      toast.error("Failed to export CSV");
      console.error("Export error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400 mb-3" />
        <span className="text-sm text-zinc-500">
          Loading project inventory...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">
          Unable to load inventory
        </h3>
        <p className="text-sm text-zinc-600 text-center mb-4">{error}</p>
        <Button variant="outline" onClick={fetchAllData}>
          <Loader2 className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <StatisticsCards
        totalItems={totalItems}
        totalQuantity={totalQuantity}
        totalCost={totalCost}
        totalTransferred={totalTransferred}
        totalReturned={totalReturned}
        lowStockItems={lowStockItems}
        outOfStockItems={outOfStockItems}
      />

      {/* Tabs for different views */}
      <Tabs
        value={activeView}
        onValueChange={(v) => setActiveView(v as "transactions" | "current")}
      >
        <TabsList>
          <TabsTrigger value="current" className="gap-2">
            <List className="h-4 w-4" />
            Current Inventory
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        {/* Current Inventory Tab */}
        <TabsContent value="current">
          <CurrentInventoryTab
            currentInventory={currentInventory}
            inventoryItems={inventoryItems}
            records={records}
            setViewDetails={setViewDetails}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            formatTime={formatTime}
            projectId={projectId}
            refreshData={fetchAllData}
            user={userData}
          />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <TransactionsTab
            records={records}
            inventoryItems={inventoryItems}
            recentActions={recentActions}
            setViewDetails={setViewDetails}
            getActionConfig={getActionConfig}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <DetailsDialog
        viewDetails={viewDetails}
        setViewDetails={setViewDetails}
        getActionConfig={getActionConfig}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    </div>
  );
}
