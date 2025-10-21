// components/admin/supplier/views/SupplierView.tsx
"use client";

import { ISupplier } from "@/types/supplier";
import { SupplierTable } from "@/components/admin/supplier/Table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  X,
  Filter,
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
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type SupplierStatusFilter = "all" | "active" | "inactive" | "pending";

interface SupplierViewProps {
  suppliers: ISupplier[];
  filteredSuppliers: ISupplier[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: SupplierStatusFilter;
  setStatusFilter: (filter: SupplierStatusFilter) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  hasActiveFilters: boolean;
  onAddSupplier: () => void;
  onDeleteSupplier: (supplier: ISupplier) => void;
  onViewSupplier: (supplier: ISupplier) => void;
  onClearFilters: () => void;
  // Pagination props
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (perPage: number) => void;
}

export function SupplierView({
  suppliers,
  filteredSuppliers,
  loading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  isFilterOpen,
  setIsFilterOpen,
  hasActiveFilters,
  onAddSupplier,
  onDeleteSupplier,
  onViewSupplier,
  onClearFilters,
  // Pagination
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
}: SupplierViewProps) {
  // Pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSuppliers.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(startIndex, endIndex);

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
    <Card className="w-full rounded-sm shadow-none border">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-foreground-900 font-geist">
              Supplier Management
            </CardTitle>
            <CardDescription className="font-geist">
              View and manage all suppliers in your system
              {hasActiveFilters && " (filtered)"}
            </CardDescription>
          </div>
          <Button
            onClick={onAddSupplier}
            className="rounded-sm bg-gray-900 hover:bg-gray-800 text-white whitespace-nowrap font-geist"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Supplier Search and Filter Bar */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 rounded-sm border-gray-200 border-1 border-b-0 font-geist h-8 text-sm"
                />
                {searchTerm && (
                  <X
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700"
                    onClick={() => setSearchTerm("")}
                  />
                )}
              </div>

              <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-sm gap-2 font-geist"
                    disabled={loading}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge
                        variant="secondary"
                        className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center bg-gray-900 text-white"
                      >
                        !
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-white font-geist"
                  align="start"
                >
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className={statusFilter === "all" ? "bg-gray-100" : ""}
                      onClick={() => setStatusFilter("all")}
                    >
                      All Suppliers
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={statusFilter === "active" ? "bg-gray-100" : ""}
                      onClick={() => setStatusFilter("active")}
                    >
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={
                        statusFilter === "inactive" ? "bg-gray-100" : ""
                      }
                      onClick={() => setStatusFilter("inactive")}
                    >
                      Inactive
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={
                        statusFilter === "pending" ? "bg-gray-100" : ""
                      }
                      onClick={() => setStatusFilter("pending")}
                    >
                      Pending
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

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
                  className="rounded-sm text-gray-600 hover:text-gray-900 font-geist"
                >
                  Clear
                  <X className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Supplier Table */}
        {filteredSuppliers.length === 0 && !loading ? (
          <Card className="max-w-md mx-auto rounded-sm shadow-none border">
            <CardContent className="pt-2">
              <div className="text-center p-8">
                <h3 className="text-xl font-semibold text-gray-900 font-geist">
                  No suppliers found
                </h3>
                <p className="text-gray-600 mt-2 font-geist">
                  {hasActiveFilters
                    ? "Try adjusting your filters or search query."
                    : "No suppliers available. Add a new supplier to get started."}
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={onClearFilters}
                    variant="default"
                    size="sm"
                    className="mt-4 rounded-sm font-geist"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="rounded-none border-none overflow-x-auto">
              <SupplierTable
                suppliers={currentSuppliers}
                loading={loading}
                onDelete={onDeleteSupplier}
                onView={onViewSupplier}
              />
            </div>

            {/* Pagination - Always visible */}
            {filteredSuppliers.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <span>•</span>
                  <span>{filteredSuppliers.length} total suppliers</span>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
