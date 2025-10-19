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

export interface MaterialsViewProps {
  items: IInventory[];
  loading: boolean;
  searchTerm: string;
  statusFilter: "all" | "inStock" | "lowStock" | "outOfStock";
  categoryFilter: "all" | string;
  viewMode: "table" | "grid";
  columnVisibility: {
    id: boolean;
    sku: boolean;
    name: boolean;
    category: boolean;
    quantity: boolean;
    unit: boolean;
    unitCost: boolean;
    totalCost: boolean;
    location: boolean;
    supplier: boolean;
    reorderPoint: boolean;
    status: boolean;
    actions: boolean;
  };
  currentPage: number;
  itemsPerPage: number;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onStatusFilterChange: (
    filter: "all" | "inStock" | "lowStock" | "outOfStock"
  ) => void;
  onCategoryFilterChange: (filter: "all" | string) => void;
  onViewModeChange: (mode: "table" | "grid") => void;
  onColumnVisibilityChange: (
    column:
      | "id"
      | "sku"
      | "name"
      | "category"
      | "quantity"
      | "unit"
      | "unitCost"
      | "totalCost"
      | "location"
      | "supplier"
      | "reorderPoint"
      | "status"
      | "actions"
  ) => void;
  onAddItem: () => void;
  onExportPDF: () => void;
  onEditItem: (item: IInventory) => void;
  onDeleteItem: (item: IInventory) => void;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}
