// components/projects/inventory-components/StatisticsCards.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatisticsCardsProps {
  totalItems: number;
  totalQuantity: number;
  totalCost: number;
  totalTransferred: number;
  totalReturned: number; // Now this is required and should be passed
  lowStockItems: number;
  outOfStockItems: number;
}

export function StatisticsCards({
  totalItems,
  totalQuantity,
  totalCost,
  totalTransferred,
  totalReturned = 0, // Default value to prevent undefined
  lowStockItems,
  outOfStockItems,
}: StatisticsCardsProps) {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Safe formatting functions
  const safeFormatNumber = (num: number | undefined) => {
    return (num || 0).toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b">
      {/* Total Value */}
      <Card className="rounded-none border-0 border-zinc-200 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Value
            </p>
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-zinc-900">
                {formatCurrency(totalCost || 0)}
              </p>
              <p className="text-xs text-zinc-500">
                Current project inventory value
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfers In */}
      <Card className="rounded-none border-0  border-zinc-200 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Transferred In
            </p>
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-zinc-900">
                {safeFormatNumber(totalTransferred)}
              </p>
              <p className="text-xs text-zinc-500">Units from main inventory</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns Out */}
      <Card className="rounded-none border-0 border-r border-zinc-200 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Returned Out
            </p>
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-zinc-900">
                {safeFormatNumber(totalReturned)}
              </p>
              <p className="text-xs text-zinc-500">Units to main inventory</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Status */}
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Stock Status
            </p>
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <div>
                  <p className="text-2xl font-semibold text-zinc-900">
                    {safeFormatNumber(lowStockItems)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Low stock</p>
                </div>
                <div className="h-8 w-px bg-zinc-200"></div>
                <div>
                  <p className="text-2xl font-semibold text-zinc-900">
                    {safeFormatNumber(outOfStockItems)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Out of stock</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Based on project reorder points
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
