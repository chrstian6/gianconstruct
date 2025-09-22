// types/Inventory.ts
export interface IInventory {
  item_id: string; // xxxx-xxxx format
  sku: string; // unique SKU code
  name: string;
  category: string;
  quantity: number;
  unit: string; // pcs, kg, liters
  description?: string;
  supplier?: string;
  reorderPoint: number; // stock threshold
  safetyStock?: number; // safety stock level
  location?: string; // warehouse or site location
  unitCost: number; // cost per unit
  timeCreated: string; // ISO string date
  timeUpdated: string; // ISO string date
  lastUpdated?: string; // alias for timeUpdated
  createdAt?: string; // alias for timeCreated
}
