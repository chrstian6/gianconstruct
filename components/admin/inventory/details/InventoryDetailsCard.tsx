// components/admin/inventory/details/ItemDetailsCard.tsx
"use client";

import { IInventory } from "@/types/Inventory";
import { Badge } from "@/components/ui/badge";

interface ItemDetailsCardProps {
  item: IInventory;
}

// Helper function to get status information for an item
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

export function ItemDetailsCard({ item }: ItemDetailsCardProps) {
  const statusInfo = getStatusInfo(item);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Name</h4>
          <p className="text-sm font-medium">{item.name}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">SKU</h4>
          <p className="text-sm">{item.sku}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Category</h4>
          <p className="text-sm">{item.category}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Status</h4>
          <Badge variant={statusInfo.variant} className="text-xs">
            {statusInfo.text}
          </Badge>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Quantity</h4>
          <p className="text-sm">
            {item.quantity} {item.unit}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Unit Cost</h4>
          <p className="text-sm">₱{item.unitCost?.toLocaleString()}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Total Value</h4>
          <p className="text-sm">
            ₱{(item.quantity * (item.unitCost || 0)).toLocaleString()}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Reorder Point</h4>
          <p className="text-sm">{item.reorderPoint}</p>
        </div>
        {item.location && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Location</h4>
            <p className="text-sm">{item.location}</p>
          </div>
        )}
        {item.supplier && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Supplier</h4>
            <p className="text-sm">{item.supplier}</p>
          </div>
        )}
        {item.item_id && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Item ID</h4>
            <p className="text-sm font-mono text-xs">{item.item_id}</p>
          </div>
        )}
        {item.safetyStock && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Safety Stock</h4>
            <p className="text-sm">{item.safetyStock}</p>
          </div>
        )}
      </div>
      {item.description && (
        <div>
          <h4 className="text-sm font-medium text-gray-500">Description</h4>
          <p className="text-sm">{item.description}</p>
        </div>
      )}
    </div>
  );
}
