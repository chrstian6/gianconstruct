"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryBarChart } from "@/components/admin/inventory/CategoryBarChart";
import {
  CheckCircle,
  AlertTriangle,
  X,
  TrendingUp,
  Package,
} from "lucide-react";
import { IInventory } from "@/types/Inventory";

interface CategoryData {
  category: string;
  items: {
    name: string;
    quantity: number;
    reorderPoint: number;
    safetyStock?: number;
  }[];
}

interface AnalyticsProps {
  filteredItems: IInventory[];
  chartData: CategoryData[];
  chartCategories: string[];
  chartLoading: boolean;
}

export function Analytics({
  filteredItems,
  chartData,
  chartCategories,
  chartLoading,
}: AnalyticsProps) {
  // Calculate inventory stats - same logic as before
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

    // Calculate total inventory value
    const totalInventoryValue = filteredItems.reduce(
      (total, item) => total + item.quantity * (item.unitCost || 0),
      0
    );

    // Calculate category statistics for PDF
    const categoryStats = Array.from(
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
    }));

    return {
      inStock,
      lowStock,
      outOfStock,
      restockNeeded,
      total: filteredItems.length,
      totalValue: totalInventoryValue,
      categoryStats,
    };
  }, [filteredItems]);

  // Format currency with Philippine Peso sign
  const formatPeso = (amount: number) => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Card className="w-full rounded-sm shadow-md border-none">
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
                {formatPeso(inventoryStats.totalValue)}
              </p>
              <p className="text-xs text-gray-600">Inventory worth</p>
            </CardContent>
          </Card>

          {/* Additional Stats Cards */}
          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Total Items</span>
              </div>
              <p className="text-2xl font-bold mt-2">{inventoryStats.total}</p>
              <p className="text-xs text-gray-600">All inventory items</p>
            </CardContent>
          </Card>

          <Card className="rounded-sm border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Restock Needed</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {inventoryStats.restockNeeded}
              </p>
              <p className="text-xs text-gray-600">Below reorder point</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
