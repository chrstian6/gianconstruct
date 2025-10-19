"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Home,
  Square,
  Plus,
  X,
  CheckSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  deleteDesign,
  getDesignsPaginated,
  deleteMultipleDesigns,
} from "@/action/designs";
import { toast } from "sonner";
import { Design, PaginatedDesignsResponse } from "@/types/design";
import DesignDetails from "./DesignDetails";
import { useModalStore } from "@/lib/stores";
import EditingCatalog from "@/components/admin/catalog/EditingCatalog";
import ConfirmationModal from "@/components/ConfirmationModal";
import NotFound from "../NotFound";
import { useSearchParams } from "next/navigation";
import CatalogForm from "@/components/admin/catalog/Form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AdminCatalogCard from "@/components/admin/catalog/AdminCatalogCard";
import { Badge } from "@/components/ui/badge";

export default function CatalogList() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minDownpayment, setMinDownpayment] = useState<string>(""); // UPDATED: Replaced minRooms
  const [maxDownpayment, setMaxDownpayment] = useState<string>(""); // UPDATED: Replaced maxRooms
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { isDeleteDesignOpen, designIdToDelete, setIsDeleteDesignOpen } =
    useModalStore();
  const cardsPerPage = 12;
  const searchParams = useSearchParams();

  // Multi-select state
  const [selectedDesigns, setSelectedDesigns] = useState<Set<string>>(
    new Set()
  );
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // State for paginated data
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Available categories for tags - Always visible regardless of data
  const categories = [
    "all",
    "industrial",
    "residential",
    "commercial",
    "office",
    "custom",
  ];

  // Fetch designs with pagination
  const fetchDesigns = async () => {
    try {
      setIsLoading(true);

      const result = await getDesignsPaginated({
        page: currentPage,
        limit: cardsPerPage,
        category: filterCategory === "all" ? undefined : filterCategory,
        search: searchQuery || undefined,
        minPrice: minPrice ? parseFloat(minPrice.replace(/,/g, "")) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice.replace(/,/g, "")) : undefined,
        minDownpayment: minDownpayment
          ? parseFloat(minDownpayment.replace(/,/g, ""))
          : undefined, // UPDATED
        maxDownpayment: maxDownpayment
          ? parseFloat(maxDownpayment.replace(/,/g, ""))
          : undefined, // UPDATED
      });

      if (!result) {
        toast.error("Failed to fetch designs: No response from server");
        setDesigns([]);
        setTotalCount(0);
        setTotalPages(1);
        return;
      }

      if (result.success && result.data) {
        const data = result.data as PaginatedDesignsResponse;
        setDesigns(data.designs || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        toast.error(result.error || "Failed to fetch designs");
        setDesigns([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching designs:", error);
      toast.error("An unexpected error occurred while fetching designs");
      setDesigns([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [
    currentPage,
    filterCategory,
    searchQuery,
    minPrice,
    maxPrice,
    minDownpayment, // UPDATED
    maxDownpayment, // UPDATED
  ]);

  // Reset selection when designs change
  useEffect(() => {
    setSelectedDesigns(new Set());
    setIsSelectMode(false);
  }, [
    designs,
    currentPage,
    filterCategory,
    searchQuery,
    minPrice,
    maxPrice,
    minDownpayment, // UPDATED
    maxDownpayment, // UPDATED
  ]);

  // Handle design selection from URL parameter
  useEffect(() => {
    const designId = searchParams.get("designId");
    if (designId && designs.length > 0) {
      const designToSelect = designs.find((d) => d.design_id === designId);
      if (designToSelect) {
        setSelectedDesign(designToSelect);
      }
    }
  }, [searchParams, designs]);

  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatPrice = (price: number): string => {
    return `₱${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSquareMeters = (square_meters: number): string => {
    return `${square_meters.toLocaleString("en-US")} sqm`;
  };

  const handleDelete = (id: string) => {
    setDesigns((prevDesigns) =>
      prevDesigns.filter((design: Design) => design.design_id !== id)
    );
    // Reset to page 1 if we're on the last page and it becomes empty
    if (designs.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleUpdate = (updatedDesign: Design) => {
    setDesigns((prevDesigns) =>
      prevDesigns.map((design) =>
        design.design_id === updatedDesign.design_id ? updatedDesign : design
      )
    );
  };

  const handleAddDesign = (design: Design) => {
    setDesigns((prevDesigns) => [design, ...prevDesigns]);
    setIsModalOpen(false);
    setCurrentPage(1);
    toast.success("Design added successfully!");
  };

  const handleDeleteClick = (id: string) => {
    setIsDeleteDesignOpen(true, id);
  };

  const confirmDelete = async () => {
    if (!designIdToDelete) return;

    try {
      const result = await deleteDesign(designIdToDelete);
      if (result.success) {
        // Immediately update the UI
        handleDelete(designIdToDelete);

        // Also refetch to ensure consistency
        await fetchDesigns();

        if (selectedDesign?.design_id === designIdToDelete) {
          setSelectedDesign(null);
        }
        toast.success("Design deleted successfully!");
      } else {
        toast.error(result.error || "Failed to delete design");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the design");
      console.error("Delete error:", error);
    } finally {
      setIsDeleteDesignOpen(false);
    }
  };

  const handleMultiDeleteConfirm = async () => {
    if (selectedDesigns.size === 0) return;

    try {
      const designIds = Array.from(selectedDesigns);
      const response = await deleteMultipleDesigns(designIds);

      if (response.success) {
        toast.success(
          `Successfully deleted ${selectedDesigns.size} design${selectedDesigns.size > 1 ? "s" : ""}`
        );

        // Immediately update the UI by removing deleted designs
        setDesigns((prevDesigns) =>
          prevDesigns.filter((design) => !selectedDesigns.has(design.design_id))
        );

        // Also refetch to ensure consistency
        await fetchDesigns();

        setSelectedDesigns(new Set());
        setIsSelectMode(false);
      } else {
        toast.error(response.error || "Failed to delete designs");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the designs");
      console.error("Multi-delete error:", error);
    } finally {
      setIsMultiDeleteModalOpen(false);
    }
  };

  const handleMultiDeleteCancel = () => {
    setIsMultiDeleteModalOpen(false);
  };

  const formatNumberWithCommas = (value: string): string => {
    const numeric = value.replace(/[^0-9]/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Multi-select functions
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedDesigns(new Set());
    }
  };

  const toggleSelectAll = () => {
    if (selectedDesigns.size === designs.length) {
      setSelectedDesigns(new Set());
    } else {
      const allDesignIds = designs.map((design) => design.design_id);
      setSelectedDesigns(new Set(allDesignIds));
    }
  };

  const toggleDesignSelection = (designId: string) => {
    const newSelected = new Set(selectedDesigns);
    if (newSelected.has(designId)) {
      newSelected.delete(designId);
    } else {
      newSelected.add(designId);
    }
    setSelectedDesigns(newSelected);
  };

  const handleMultiDeleteClick = () => {
    if (selectedDesigns.size > 0) {
      setIsMultiDeleteModalOpen(true);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (editingDesign) {
    return (
      <EditingCatalog
        design={editingDesign}
        onCancel={() => setEditingDesign(null)}
        onUpdate={(updatedDesign) => {
          handleUpdate(updatedDesign);
          setEditingDesign(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col font-geist">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 bg-white border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1 mb-4 px-5 pt-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground font-geist">
              Designs Catalog
            </h1>
            <p className="text-gray-600 mt-1 text-sm font-geist">
              {isLoading
                ? "Loading..."
                : `${totalCount.toLocaleString()} designs available`}
            </p>
          </div>
        </div>
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-5 pb-5">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search designs..."
                className="pl-10 w-full border-gray-300 rounded-lg focus:border-gray-500 focus:ring-gray-500 font-geist"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-geist"
                >
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-4 space-y-4 bg-white shadow-lg rounded-lg border border-gray-200 font-geist">
                <div>
                  <Label
                    htmlFor="dropdown_category_filter"
                    className="block text-sm font-medium text-gray-700 mb-1 font-geist"
                  >
                    Category
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      setFilterCategory(value);
                      setCurrentPage(1);
                    }}
                    value={filterCategory}
                  >
                    <SelectTrigger
                      id="dropdown_category_filter"
                      className="w-full border-gray-300 rounded-lg font-geist"
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="font-geist">
                      <SelectItem value="all" className="font-geist">
                        All Categories
                      </SelectItem>
                      <SelectItem value="industrial" className="font-geist">
                        Industrial
                      </SelectItem>
                      <SelectItem value="residential" className="font-geist">
                        Residential
                      </SelectItem>
                      <SelectItem value="commercial" className="font-geist">
                        Commercial
                      </SelectItem>
                      <SelectItem value="office" className="font-geist">
                        Office Buildings
                      </SelectItem>
                      <SelectItem value="custom" className="font-geist">
                        Custom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="dropdown_min_price"
                      className="block text-sm font-medium text-gray-700 mb-1 font-geist"
                    >
                      Min Price
                    </Label>
                    <Input
                      id="dropdown_min_price"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(formatNumberWithCommas(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-full border-gray-300 rounded-lg font-geist"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="dropdown_max_price"
                      className="block text-sm font-medium text-gray-700 mb-1 font-geist"
                    >
                      Max Price
                    </Label>
                    <Input
                      id="dropdown_max_price"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(formatNumberWithCommas(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-full border-gray-300 rounded-lg font-geist"
                    />
                  </div>
                </div>

                {/* UPDATED: Replaced Rooms filters with Downpayment filters */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="dropdown_min_downpayment"
                      className="block text-sm font-medium text-gray-700 mb-1 font-geist"
                    >
                      Min Downpayment
                    </Label>
                    <Input
                      id="dropdown_min_downpayment"
                      placeholder="Min"
                      value={minDownpayment}
                      onChange={(e) => {
                        setMinDownpayment(
                          formatNumberWithCommas(e.target.value)
                        );
                        setCurrentPage(1);
                      }}
                      className="w-full border-gray-300 rounded-lg font-geist"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="dropdown_max_downpayment"
                      className="block text-sm font-medium text-gray-700 mb-1 font-geist"
                    >
                      Max Downpayment
                    </Label>
                    <Input
                      id="dropdown_max_downpayment"
                      placeholder="Max"
                      value={maxDownpayment}
                      onChange={(e) => {
                        setMaxDownpayment(
                          formatNumberWithCommas(e.target.value)
                        );
                        setCurrentPage(1);
                      }}
                      className="w-full border-gray-300 rounded-lg font-geist"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 font-geist"
                  onClick={() => {
                    setFilterCategory("all");
                    setMinPrice("");
                    setMaxPrice("");
                    setMinDownpayment(""); // UPDATED
                    setMaxDownpayment(""); // UPDATED
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Publish Design Button */}
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white font-geist whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" /> Publish Design
            </Button>
          </div>

          {/* Multi-select Actions - Moved to the right/end */}
          <div className="flex items-center gap-2">
            {isSelectMode ? (
              <div className="flex gap-2 items-center">
                {/* Select All / Deselect All */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="font-geist"
                >
                  {selectedDesigns.size === designs.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>

                {/* X icon for cancel */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectMode}
                  className="font-geist"
                  title="Cancel selection"
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Trash icon for delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMultiDeleteClick}
                  disabled={selectedDesigns.size === 0}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 font-geist"
                  title={`Delete ${selectedDesigns.size} selected design${selectedDesigns.size > 1 ? "s" : ""}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* Selection count badge */}
                {selectedDesigns.size > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-sm"
                  >
                    {selectedDesigns.size} selected
                  </Badge>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectMode}
                className="font-geist flex items-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                Select
              </Button>
            )}
          </div>
        </div>
        {/* Category Tags - Always visible */}
        <div className="flex flex-wrap gap-2 border-t px-5 py-5">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setFilterCategory(category);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 font-geist ${
                filterCategory === category
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category === "all"
                ? "All Categories"
                : capitalizeFirstLetter(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Section with Cards and Pagination */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Skeleton Loading State
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: cardsPerPage }).map((_, index) => (
                <div key={index} className="animate-pulse font-geist">
                  <div className="bg-gray-200 rounded-xl aspect-video mb-3"></div>
                  <div className="bg-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-300 rounded h-4 w-3/4 mb-2"></div>
                        <div className="bg-gray-300 rounded h-3 w-1/2"></div>
                      </div>
                      <div className="bg-gray-300 rounded-full h-7 w-7"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : designs.length === 0 ? (
          <div className="p-6">
            <div className="p-8 text-center font-geist">
              <NotFound description="Try adjusting the filters or publish your first design" />
            </div>
          </div>
        ) : (
          <div className="px-10 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {designs.map((design) => (
                <AdminCatalogCard
                  key={design.design_id}
                  design={design}
                  onEdit={setEditingDesign}
                  onDelete={handleDeleteClick}
                  onSelect={setSelectedDesign}
                  formatPrice={formatPrice}
                  formatSquareMeters={formatSquareMeters}
                  capitalizeFirstLetter={capitalizeFirstLetter}
                  isSelectMode={isSelectMode}
                  isSelected={selectedDesigns.has(design.design_id)}
                  onToggleSelect={() => toggleDesignSelection(design.design_id)}
                />
              ))}
            </div>

            {/* Pagination Section - Always visible even with 1 page */}
            <div className="my-6 px-6 p-10 border-gray-200">
              <Pagination>
                <PaginationContent className="font-geist">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50 font-geist"
                          : "cursor-pointer font-geist"
                      }
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis className="font-geist" />
                      ) : (
                        <PaginationLink
                          onClick={() => setCurrentPage(page as number)}
                          isActive={currentPage === page}
                          className={
                            currentPage === page
                              ? "bg-gray-900 text-white hover:bg-gray-800 font-geist"
                              : "text-gray-700 hover:bg-gray-100 font-geist"
                          }
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50 font-geist"
                          : "cursor-pointer font-geist"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              {/* Page info */}
              <div className="text-center mt-4 text-sm text-gray-600 font-geist">
                Page {currentPage} of {totalPages} •{" "}
                {totalCount.toLocaleString()} total designs
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedDesign && (
        <DesignDetails
          design={selectedDesign}
          onBack={() => setSelectedDesign(null)}
          onDelete={handleDeleteClick}
          onEdit={() => {
            setEditingDesign(selectedDesign);
            setSelectedDesign(null);
          }}
          isOpen={!!selectedDesign}
        />
      )}

      {/* Add Design Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-gray-200 p-0 font-geist">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-gray-900 font-geist">
              <Plus className="h-5 w-5" />
              Publish New Design
            </DialogTitle>
            <DialogDescription className="text-gray-600 font-geist">
              Create a new design entry for your catalog
            </DialogDescription>
          </DialogHeader>
          <CatalogForm onAddDesign={handleAddDesign} />
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={isDeleteDesignOpen}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDesignOpen(false)}
        title="Confirm Deletion"
        description="Are you sure you want to delete this design? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={isMultiDeleteModalOpen}
        onConfirm={handleMultiDeleteConfirm}
        onCancel={handleMultiDeleteCancel}
        title={`Delete ${selectedDesigns.size} Design${selectedDesigns.size > 1 ? "s" : ""}`}
        description={`Are you sure you want to delete ${selectedDesigns.size} selected design${selectedDesigns.size > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText={`Delete ${selectedDesigns.size} Design${selectedDesigns.size > 1 ? "s" : ""}`}
        cancelText="Cancel"
      />
    </div>
  );
}
