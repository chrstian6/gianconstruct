// types/project-inventory.ts
export interface ProjectInventoryRecord {
  _id: string;
  projectInventory_id: string;
  project_id: string;
  product_id: string;
  quantity: number;
  unit: string;
  supplier: string;
  notes?: string;
  action: "checked_out" | "returned" | "adjusted";
  salePrice?: number;
  unitCost?: number;
  totalValue?: number;
  totalCost?: number;
  projectReorderPoint?: number; // NEW: Project-specific reorder point
  action_by: {
    user_id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInventoryInput {
  project_id: string;
  product_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  action: "checked_out" | "returned" | "adjusted";
  projectReorderPoint?: number; // NEW: Optional project reorder point
  action_by: {
    user_id: string;
    name: string;
    role: string;
  };
}

export interface ProjectInventoryResponse {
  success: boolean;
  records?: ProjectInventoryRecord[];
  actions?: ProjectInventoryRecord[];
  error?: string;
}

export interface InventorySummaryItem {
  product_id: string;
  quantity: number;
  totalValue: number;
  totalCost: number;
  salePrice: number;
  unitCost: number;
  name?: string;
  category?: string;
  unit?: string;
  supplier?: string;
  location?: string;
  projectReorderPoint?: number; // NEW: Project-specific reorder point
  isLowStock: boolean;
  profitMargin: number;
}

export interface InventorySummaryResponse {
  success: boolean;
  summary?: InventorySummaryItem[];
  error?: string;
}

export interface CurrentInventoryItem {
  product_id: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
  totalTransferredIn: number;
  totalReturnedOut: number;
  action: string;
  unitCost: number;
  totalCost: number;
  salePrice?: number;
  totalValue?: number;
  supplier: string;
  location?: string;
  projectReorderPoint?: number; // NEW: Project-specific reorder point
  isLowStock: boolean;
  profitMargin?: number;
  lastTransaction?: string;
  lastProjectInventoryId?: string;
  totalCheckedOut?: number;
  totalReturned?: number;
  totalAdjusted?: number;
}
