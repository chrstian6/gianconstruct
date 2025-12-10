// components/admin/inventory/views/MaterialsView.tsx
"use client";

import { IInventory } from "@/types/Inventory";
import { InventoryTable } from "@/components/admin/inventory/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  X,
  Filter,
  FileText,
  Rows4,
  Grid3X3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type StatusFilter = "all" | "inStock" | "lowStock" | "outOfStock";
type CategoryFilter = "all" | string;
type ViewMode = "table" | "grid";

interface MaterialsViewProps {
  items: IInventory[];
  filteredItems: IInventory[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  categoryFilter: CategoryFilter;
  setCategoryFilter: (filter: CategoryFilter) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
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
  setColumnVisibility: (visibility: any) => void;
  categories: string[];
  hasActiveFilters: boolean;
  onAddItem: () => void;
  onEditItem: (item: IInventory) => void;
  onDeleteItem: (item: IInventory) => void;
  onViewDetails: (item: IInventory) => void;
  onExportPDF: () => void;
  onClearFilters: () => void;
  // Pagination props
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (perPage: number) => void;
}

export function MaterialsView({
  items,
  filteredItems,
  loading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  isFilterOpen,
  setIsFilterOpen,
  viewMode,
  setViewMode,
  columnVisibility,
  setColumnVisibility,
  categories,
  hasActiveFilters,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onViewDetails,
  onExportPDF,
  onClearFilters,
  // Pagination
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
}: MaterialsViewProps) {
  const toggleColumnVisibility = (column: keyof typeof columnVisibility) => {
    setColumnVisibility((prev: typeof columnVisibility) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push(-1); // -1 represents ellipsis
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push(-2); // -2 represents ellipsis
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Inventory</h2>
          <p className="text-sm text-gray-600">Manage your inventory items</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={onExportPDF}
            className="gap-2 bg-gray-800 hover:bg-gray-900"
            disabled={loading || filteredItems.length === 0}
            title={filteredItems.length === 0 ? "No items to export" : ""}
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            onClick={onAddItem}
            variant="default"
            size="sm"
            className="whitespace-nowrap bg-red-600 hover:bg-red-700"
            disabled={loading}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 w-full"
            />
            {searchTerm && (
              <X
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>

          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-gray-300"
                disabled={loading}
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge
                    variant="secondary"
                    className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center bg-gray-800 text-white"
                  >
                    !
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className={statusFilter === "all" ? "bg-gray-100" : ""}
                  onClick={() => setStatusFilter("all")}
                >
                  All Items
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={statusFilter === "inStock" ? "bg-gray-100" : ""}
                  onClick={() => setStatusFilter("inStock")}
                >
                  In Stock
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={statusFilter === "lowStock" ? "bg-gray-100" : ""}
                  onClick={() => setStatusFilter("lowStock")}
                >
                  Low Stock
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={statusFilter === "outOfStock" ? "bg-gray-100" : ""}
                  onClick={() => setStatusFilter("outOfStock")}
                >
                  Out of Stock
                </DropdownMenuItem>
              </DropdownMenuGroup>

              {categories.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className={categoryFilter === "all" ? "bg-gray-100" : ""}
                      onClick={() => setCategoryFilter("all")}
                    >
                      All Categories
                    </DropdownMenuItem>
                    {categories.map((category) => (
                      <DropdownMenuItem
                        key={category}
                        className={
                          categoryFilter === category ? "bg-gray-100" : ""
                        }
                        onClick={() => setCategoryFilter(category)}
                      >
                        {category}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onClearFilters}>
                    Clear Filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-600 hover:text-gray-900"
            >
              Clear
              <X className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("table")}
            className={viewMode === "table" ? "bg-gray-100" : ""}
            aria-label="Table view"
            disabled={loading}
          >
            <Rows4 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-gray-100" : ""}
            aria-label="Grid view"
            disabled={loading}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Columns <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={columnVisibility.id}
                onCheckedChange={() => toggleColumnVisibility("id")}
              >
                Product ID
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.name}
                onCheckedChange={() => toggleColumnVisibility("name")}
              >
                Product Name
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.category}
                onCheckedChange={() => toggleColumnVisibility("category")}
              >
                Category
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.quantity}
                onCheckedChange={() => toggleColumnVisibility("quantity")}
              >
                Quantity
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.unit}
                onCheckedChange={() => toggleColumnVisibility("unit")}
              >
                Unit
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.unitCost}
                onCheckedChange={() => toggleColumnVisibility("unitCost")}
              >
                Base Price
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.salePrice}
                onCheckedChange={() => toggleColumnVisibility("salePrice")}
              >
                Sale Price
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.totalCapital}
                onCheckedChange={() => toggleColumnVisibility("totalCapital")}
              >
                Total Capital
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.totalValue}
                onCheckedChange={() => toggleColumnVisibility("totalValue")}
              >
                Total Value
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.location}
                onCheckedChange={() => toggleColumnVisibility("location")}
              >
                Location
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.supplier}
                onCheckedChange={() => toggleColumnVisibility("supplier")}
              >
                Supplier
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.reorderPoint}
                onCheckedChange={() => toggleColumnVisibility("reorderPoint")}
              >
                Reorder Point
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.status}
                onCheckedChange={() => toggleColumnVisibility("status")}
              >
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.actions}
                onCheckedChange={() => toggleColumnVisibility("actions")}
              >
                Actions
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && !loading ? (
        <div className="border border-gray-200 rounded-lg bg-white p-12 text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rows4 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No inventory items found
          </h3>
          <p className="text-gray-600 max-w-sm mx-auto mb-6">
            {hasActiveFilters
              ? "Try adjusting your filters or search query."
              : "No inventory items available. Add a new item to get started."}
          </p>
          {hasActiveFilters && (
            <Button
              onClick={onClearFilters}
              variant="default"
              size="sm"
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Inventory Table */}
          <div className="w-full">
            <InventoryTable
              items={currentItems}
              loading={loading}
              onDelete={onDeleteItem}
              onEdit={onEditItem}
              onViewDetails={onViewDetails}
              columnVisibility={columnVisibility}
            />
          </div>

          {/* Pagination - Always visible */}
          {filteredItems.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <span>•</span>
                <span>{filteredItems.length} total items</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) =>
                    page === -1 || page === -2 ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-sm text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className={`h-8 w-8 p-0 text-xs ${
                          currentPage === page ? "bg-gray-900 text-white" : ""
                        }`}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page
                  }}
                >
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue placeholder={itemsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
