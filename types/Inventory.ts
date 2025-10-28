// types/Inventory.ts
export interface IInventory {
  product_id: string; // xxxx-xxxx format
  name: string;
  category: string;
  quantity: number;
  unit: string; // pcs, kg, liters
  description?: string;
  supplier?: string;
  reorderPoint: number; // stock threshold
  location?: string; // warehouse or site location
  unitCost: number; // cost per unit (base price)
  salePrice?: number; // selling price
  totalCapital?: number; // unitCost * quantity (virtual)
  totalValue?: number; // salePrice * quantity (virtual)
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
    name: boolean;
    category: boolean;
    quantity: boolean;
    unit: boolean;
    unitCost: boolean;
    salePrice: boolean;
    totalCapital: boolean;
    totalValue: boolean;
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
      | "name"
      | "category"
      | "quantity"
      | "unit"
      | "unitCost"
      | "salePrice"
      | "totalCapital"
      | "totalValue"
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
