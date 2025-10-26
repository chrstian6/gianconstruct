// components/admin/inventory/details/InventoryDetailsCard.tsx
"use client";

import { IInventory } from "@/types/Inventory";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  DollarSign,
  BarChart3,
  MapPin,
  Truck,
  AlertTriangle,
} from "lucide-react";

interface ItemDetailsCardProps {
  item: IInventory;
}

// Helper function to get status information for an item
const getStatusInfo = (item: IInventory) => {
  const quantity = item.quantity;
  const reorderPoint = item.reorderPoint ?? 0;

  if (quantity === 0) {
    return {
      text: "Out of Stock",
      variant: "destructive" as const,
      icon: AlertTriangle,
      description: "Item is currently out of stock",
    };
  }
  if (quantity <= reorderPoint) {
    return {
      text: "Low Stock",
      variant: "secondary" as const,
      icon: AlertTriangle,
      description: "Stock level is below reorder point",
    };
  }
  return {
    text: "In Stock",
    variant: "default" as const,
    icon: Package,
    description: "Stock level is healthy",
  };
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return `₱${amount?.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Helper function to calculate stock metrics
const calculateStockMetrics = (item: IInventory) => {
  const quantity = item.quantity;
  const reorderPoint = item.reorderPoint ?? 0;
  const unitCost = item.unitCost ?? 0;
  const salePrice = item.salePrice ?? 0;

  const totalCapital = item.totalCapital ?? quantity * unitCost;
  const totalValue = item.totalValue ?? quantity * salePrice;
  const margin = salePrice - unitCost;
  const marginPercentage = unitCost > 0 ? (margin / unitCost) * 100 : 0;

  return {
    totalCapital,
    totalValue,
    margin,
    marginPercentage,
    stockHealth:
      quantity === 0 ? "empty" : quantity <= reorderPoint ? "low" : "healthy",
  };
};

export function ItemDetailsCard({ item }: ItemDetailsCardProps) {
  const statusInfo = getStatusInfo(item);
  const metrics = calculateStockMetrics(item);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.category}</p>
          </div>
        </div>
        <div className="text-right">
          <Badge
            variant={statusInfo.variant}
            className="text-xs flex items-center gap-1"
          >
            <StatusIcon className="h-3 w-3" />
            {statusInfo.text}
          </Badge>
          <p className="text-xs text-gray-500 mt-1">{statusInfo.description}</p>
        </div>
      </div>

      {/* Main Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Package className="h-4 w-4" />
            Basic Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Product ID
              </label>
              <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded border text-gray-700">
                {item.product_id}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Category
              </label>
              <p className="text-sm bg-gray-50 px-2 py-1 rounded border text-gray-700">
                {item.category}
              </p>
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Stock Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Current Stock
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {item.quantity}{" "}
                <span className="text-sm font-normal text-gray-500 uppercase">
                  {item.unit}
                </span>
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Reorder Point
              </label>
              <p className="text-sm text-gray-900">
                {item.reorderPoint ?? "Not set"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Stock Health
              </label>
              <p
                className={`text-sm font-medium ${
                  metrics.stockHealth === "empty"
                    ? "text-red-600"
                    : metrics.stockHealth === "low"
                      ? "text-amber-600"
                      : "text-green-600"
                }`}
              >
                {metrics.stockHealth.charAt(0).toUpperCase() +
                  metrics.stockHealth.slice(1)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Unit</label>
              <p className="text-sm font-medium text-gray-900 uppercase">
                {item.unit}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Unit Cost
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(item.unitCost || 0)}
              </p>
              <p className="text-xs text-gray-500">per {item.unit}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Sale Price
              </label>
              <p className="text-lg font-semibold text-green-700">
                {formatCurrency(item.salePrice || 0)}
              </p>
              <p className="text-xs text-gray-500">per {item.unit}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Total Capital
              </label>
              <p className="text-sm font-semibold text-blue-700">
                {formatCurrency(metrics.totalCapital)}
              </p>
              <p className="text-xs text-gray-500">investment</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Total Value
              </label>
              <p className="text-sm font-semibold text-green-700">
                {formatCurrency(metrics.totalValue)}
              </p>
              <p className="text-xs text-gray-500">potential revenue</p>
            </div>
            {metrics.margin > 0 && (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Margin
                  </label>
                  <p className="text-sm font-semibold text-green-700">
                    {formatCurrency(metrics.margin)}
                  </p>
                  <p className="text-xs text-gray-500">per unit</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Margin %
                  </label>
                  <p className="text-sm font-semibold text-green-700">
                    {metrics.marginPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">profit percentage</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Location & Supplier */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location & Supplier
          </h4>
          <div className="space-y-3">
            {item.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Storage Location
                  </label>
                  <p className="text-sm text-gray-900">{item.location}</p>
                </div>
              </div>
            )}
            {item.supplier && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Supplier
                  </label>
                  <p className="text-sm text-gray-900">{item.supplier}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Description
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-sm text-gray-700 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <label className="text-xs font-medium text-gray-500 block">
            Stock Status
          </label>
          <Badge variant={statusInfo.variant} className="text-xs mt-1">
            {statusInfo.text}
          </Badge>
        </div>
        <div className="text-center">
          <label className="text-xs font-medium text-gray-500 block">
            Unit
          </label>
          <p className="text-sm font-medium text-gray-900 uppercase">
            {item.unit}
          </p>
        </div>
        <div className="text-center">
          <label className="text-xs font-medium text-gray-500 block">
            Category
          </label>
          <p className="text-sm font-medium text-gray-900">{item.category}</p>
        </div>
        <div className="text-center">
          <label className="text-xs font-medium text-gray-500 block">
            Date Added
          </label>
          <p className="text-sm font-medium text-gray-900">
            {new Date(item.timeCreated).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
