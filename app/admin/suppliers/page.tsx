"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ISupplier } from "@/types/supplier";
import {
  getSuppliers,
  createSupplier,
  deleteSupplier,
} from "@/action/supplier";
import { SupplierTable } from "@/components/admin/supplier/Table";
import { AddSupplierModal } from "@/components/admin/supplier/AddSupplierModal";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/stores";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Filter } from "lucide-react";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type StatusFilter = "all" | "active" | "inactive" | "pending";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<ISupplier | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { isCreateProjectOpen, setIsCreateProjectOpen } = useModalStore();

  // Fetch suppliers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
        toast.error("Failed to fetch suppliers");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter suppliers based on search term and filters
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      // Search filter
      if (
        searchTerm &&
        !(
          supplier.companyName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          supplier.contactPerson
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          supplier.contact.includes(searchTerm) ||
          (supplier.email &&
            supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          supplier.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.supplier_id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && supplier.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [suppliers, searchTerm, statusFilter]);

  const hasActiveFilters = useMemo(
    () => searchTerm || statusFilter !== "all",
    [searchTerm, statusFilter]
  );

  // Add supplier
  const handleAdd = async (newSupplier: any) => {
    try {
      const result = await createSupplier(newSupplier);
      if (result.success && result.supplier) {
        setSuppliers((prev) => [...prev, result.supplier!]);
        setIsCreateProjectOpen(false);
        toast.success("Supplier added successfully");
      } else {
        toast.error(result.error || "Failed to add supplier");
      }
    } catch (error) {
      toast.error("Failed to add supplier");
      console.error("Error creating supplier:", error);
    }
  };

  // Delete supplier
  const handleDelete = async (supplier_id: string) => {
    try {
      const result = await deleteSupplier(supplier_id);
      if (result.success) {
        setSuppliers((prev) =>
          prev.filter((s) => s.supplier_id !== supplier_id)
        );
        toast.success("Supplier deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete supplier");
      }
    } catch (error) {
      toast.error("Failed to delete supplier");
      console.error("Error deleting supplier:", error);
    }
  };

  const handleDeleteClick = useCallback((supplier: ISupplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!supplierToDelete) return;
    await handleDelete(supplierToDelete.supplier_id);
    setIsDeleteModalOpen(false);
    setSupplierToDelete(null);
  }, [supplierToDelete, handleDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSupplierToDelete(null);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-geist bg-gray-50">
      {/* Header Section */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2 tracking-tight">
                Suppliers
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredSuppliers.length} suppliers found
                {hasActiveFilters && " (filtered)"}
              </p>
            </div>
            <Button
              onClick={() => setIsCreateProjectOpen(true)}
              className="rounded-md bg-gray-900 hover:bg-gray-800 text-white whitespace-nowrap font-geist"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Supplier
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 rounded-md border-gray-300 focus:ring-gray-500 font-geist"
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
                    variant="outline"
                    className="rounded-md border-gray-300 gap-2 font-geist"
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
                      <DropdownMenuItem onClick={clearFilters}>
                        Clear Filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="rounded-md text-gray-600 hover:text-gray-900 font-geist"
                >
                  Clear
                  <X className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredSuppliers.length === 0 && !loading ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
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
                    onClick={clearFilters}
                    className="mt-4 rounded-md font-geist"
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-gray-900 font-geist">
                    Supplier Management
                  </CardTitle>
                  <CardDescription className="font-geist">
                    View and manage all suppliers in your system
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <SupplierTable
                  suppliers={filteredSuppliers}
                  loading={loading}
                  onDelete={handleDeleteClick}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AddSupplierModal onAdd={handleAdd} />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Delete Supplier"
        description={`Are you sure you want to delete supplier "${supplierToDelete?.companyName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
