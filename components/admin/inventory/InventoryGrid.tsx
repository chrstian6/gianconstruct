import { IInventory } from "@/types/Inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";

interface InventoryGridProps {
  items: IInventory[];
  onEdit: (item: IInventory) => void;
  onDelete: (item: IInventory) => void;
  onViewDetails: (item: IInventory) => void;
  loading: boolean;
}

export function InventoryGrid({
  items,
  onEdit,
  onDelete,
  loading,
}: InventoryGridProps) {
  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.item_id} className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold truncate">
              {item.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-gray-600">SKU: {item.sku}</p>
            <p className="text-sm text-gray-600">Category: {item.category}</p>
            <p className="text-sm text-gray-600">
              Quantity: {item.quantity} {item.unit}
            </p>
            <p className="text-sm text-gray-600">
              Reorder Point: {item.reorderPoint}
            </p>
            <p className="text-sm text-gray-600">
              Safety Stock: {item.safetyStock ?? 0}
            </p>
            {item.location && (
              <p className="text-sm text-gray-600">Location: {item.location}</p>
            )}
            {item.description && (
              <p className="text-sm text-gray-600 truncate">
                Desc: {item.description}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Cost: ${item.unitCost.toFixed(2)}
            </p>
          </CardContent>
          <div className="p-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.name}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
