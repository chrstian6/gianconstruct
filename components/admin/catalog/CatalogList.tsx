"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Plus,
  Search,
  X,
  Trash2,
  CheckSquare,
  ListFilter,
  ArrowUpDown,
  LayoutGrid,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { toast } from "sonner";
import {
  deleteDesign,
  getDesignsPaginated,
  deleteMultipleDesigns,
} from "@/action/designs";
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
import { cn } from "@/lib/utils";

type CategoryFilter =
  | "all"
  | "industrial"
  | "residential"
  | "commercial"
  | "office"
  | "custom";

export default function CatalogList() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minDownpayment, setMinDownpayment] = useState<string>("");
  const [maxDownpayment, setMaxDownpayment] = useState<string>("");
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

  // State for category counts
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    all: 0,
    industrial: 0,
    residential: 0,
    commercial: 0,
    office: 0,
    custom: 0,
  });

  // Available categories for tags
  const categories = [
    "all",
    "industrial",
    "residential",
    "commercial",
    "office",
    "custom",
  ];

  // Fetch designs with pagination
  const fetchDesigns = useCallback(async () => {
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
          : undefined,
        maxDownpayment: maxDownpayment
          ? parseFloat(maxDownpayment.replace(/,/g, ""))
          : undefined,
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
  }, [
    currentPage,
    filterCategory,
    searchQuery,
    minPrice,
    maxPrice,
    minDownpayment,
    maxDownpayment,
  ]);

  // Fetch category counts for all categories
  const fetchCategoryCounts = useCallback(async () => {
    try {
      const counts: Record<string, number> = {};

      // Fetch count for "all" category (no filter)
      const allResult = await getDesignsPaginated({
        page: 1,
        limit: 1,
        search: searchQuery || undefined,
        minPrice: minPrice ? parseFloat(minPrice.replace(/,/g, "")) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice.replace(/,/g, "")) : undefined,
        minDownpayment: minDownpayment
          ? parseFloat(minDownpayment.replace(/,/g, ""))
          : undefined,
        maxDownpayment: maxDownpayment
          ? parseFloat(maxDownpayment.replace(/,/g, ""))
          : undefined,
      });

      counts.all =
        allResult.success && allResult.data
          ? allResult.data.totalCount || 0
          : 0;

      // Fetch counts for each specific category
      for (const category of categories.filter((cat) => cat !== "all")) {
        const categoryResult = await getDesignsPaginated({
          page: 1,
          limit: 1,
          category: category,
          search: searchQuery || undefined,
          minPrice: minPrice
            ? parseFloat(minPrice.replace(/,/g, ""))
            : undefined,
          maxPrice: maxPrice
            ? parseFloat(maxPrice.replace(/,/g, ""))
            : undefined,
          minDownpayment: minDownpayment
            ? parseFloat(minDownpayment.replace(/,/g, ""))
            : undefined,
          maxDownpayment: maxDownpayment
            ? parseFloat(maxDownpayment.replace(/,/g, ""))
            : undefined,
        });

        counts[category] =
          categoryResult.success && categoryResult.data
            ? categoryResult.data.totalCount || 0
            : 0;
      }

      setCategoryCounts(counts);
    } catch (error) {
      console.error("Error fetching category counts:", error);
    }
  }, [searchQuery, minPrice, maxPrice, minDownpayment, maxDownpayment]);

  useEffect(() => {
    fetchDesigns();
    fetchCategoryCounts();
  }, [fetchDesigns, fetchCategoryCounts]);

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
    minDownpayment,
    maxDownpayment,
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

  const capitalizeFirstLetter = useCallback((str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  const formatPrice = useCallback((price: number): string => {
    return `₱${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const formatSquareMeters = useCallback((square_meters: number): string => {
    return `${square_meters.toLocaleString("en-US")} sqm`;
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setDesigns((prevDesigns) =>
        prevDesigns.filter((design: Design) => design.design_id !== id)
      );
      // Reset to page 1 if we're on the last page and it becomes empty
      if (designs.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    },
    [designs.length, currentPage]
  );

  const handleUpdate = useCallback((updatedDesign: Design) => {
    setDesigns((prevDesigns) =>
      prevDesigns.map((design) =>
        design.design_id === updatedDesign.design_id ? updatedDesign : design
      )
    );
  }, []);

  const handleAddDesign = useCallback(
    (design: Design) => {
      setDesigns((prevDesigns) => [design, ...prevDesigns]);
      setIsModalOpen(false);
      setCurrentPage(1);
      toast.success("Design added successfully!");
      // Refresh counts after adding new design
      fetchCategoryCounts();
    },
    [fetchCategoryCounts]
  );

  const handleDeleteClick = useCallback(
    (id: string) => {
      setIsDeleteDesignOpen(true, id);
    },
    [setIsDeleteDesignOpen]
  );

  const confirmDelete = useCallback(async () => {
    if (!designIdToDelete) return;

    try {
      const result = await deleteDesign(designIdToDelete);
      if (result.success) {
        // Immediately update the UI
        handleDelete(designIdToDelete);

        // Also refetch to ensure consistency
        await fetchDesigns();
        await fetchCategoryCounts();

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
  }, [
    designIdToDelete,
    handleDelete,
    fetchDesigns,
    fetchCategoryCounts,
    selectedDesign,
    setIsDeleteDesignOpen,
  ]);

  const handleMultiDeleteConfirm = useCallback(async () => {
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
        await fetchCategoryCounts();

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
  }, [selectedDesigns, fetchDesigns, fetchCategoryCounts]);

  const handleMultiDeleteCancel = useCallback(() => {
    setIsMultiDeleteModalOpen(false);
  }, []);

  const formatNumberWithCommas = useCallback((value: string): string => {
    const numeric = value.replace(/[^0-9]/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }, []);

  // Multi-select functions
  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedDesigns(new Set());
    }
  }, [isSelectMode]);

  const toggleSelectAll = useCallback(() => {
    if (selectedDesigns.size === designs.length) {
      setSelectedDesigns(new Set());
    } else {
      const allDesignIds = designs.map((design) => design.design_id);
      setSelectedDesigns(new Set(allDesignIds));
    }
  }, [designs, selectedDesigns.size]);

  const toggleDesignSelection = useCallback(
    (designId: string) => {
      const newSelected = new Set(selectedDesigns);
      if (newSelected.has(designId)) {
        newSelected.delete(designId);
      } else {
        newSelected.add(designId);
      }
      setSelectedDesigns(newSelected);
    },
    [selectedDesigns]
  );

  const handleMultiDeleteClick = useCallback(() => {
    if (selectedDesigns.size > 0) {
      setIsMultiDeleteModalOpen(true);
    }
  }, [selectedDesigns.size]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setMinDownpayment("");
    setMaxDownpayment("");
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      searchQuery ||
      filterCategory !== "all" ||
      minPrice ||
      maxPrice ||
      minDownpayment ||
      maxDownpayment,
    [
      searchQuery,
      filterCategory,
      minPrice,
      maxPrice,
      minDownpayment,
      maxDownpayment,
    ]
  );

  const formatCategoryDisplay = useCallback(
    (category: string): string => {
      return category === "all"
        ? "All Categories"
        : capitalizeFirstLetter(category);
    },
    [capitalizeFirstLetter]
  );

  const getPageNumbers = useCallback(
    (totalPages: number, currentPage: number) => {
      const pages = [];
      const maxVisiblePages = 5;
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push("ellipsis");
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push("ellipsis");
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push("ellipsis");
          for (let i = currentPage - 1; i <= currentPage + 1; i++)
            pages.push(i);
          pages.push("ellipsis");
          pages.push(totalPages);
        }
      }
      return pages;
    },
    []
  );

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
    <div className="flex flex-col min-h-screen bg-zinc-50/30 font-geist">
      {/* Sticky Modern Header - Matching ProjectList */}
      <div className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
        <div className="flex flex-col gap-4 px-6 py-5 md:px-8">
          {/* Top Row: Title & Primary Action */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              {/* Increased Text Size */}
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 font-geist">
                Designs Catalog
              </h1>
              {/* Replaced dynamic count with static description */}
              <p className="text-zinc-500 mt-1 text-sm font-medium font-geist">
                Manage and organize your design catalog.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-all duration-200 font-medium px-5 h-10 rounded-lg w-full md:w-auto font-geist"
              >
                <Plus className="mr-2 h-4 w-4" /> Publish Design
              </Button>
            </div>
          </div>

          {/* Middle Row: Search, Filters & Selection Tools */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            {/* Search Bar */}
            <div className="relative w-full md:max-w-sm group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
              <Input
                placeholder="Search designs..."
                className="pl-10 h-10 bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 rounded-lg transition-all font-geist"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 text-zinc-500" />
                </button>
              )}
            </div>

            <div className="h-6 w-px bg-zinc-200 hidden md:block mx-1" />

            {/* Filters Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 border-dashed border-zinc-300 bg-transparent hover:bg-zinc-50 text-zinc-600 font-geist w-full md:w-auto justify-between md:justify-center",
                    hasActiveFilters &&
                      "border-zinc-400 bg-zinc-50 text-zinc-900"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4" />
                    <span>Filter</span>
                  </div>
                  {hasActiveFilters && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 rounded-full text-[10px]">
                      !
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-72 p-4 space-y-4 font-geist"
              >
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-zinc-900 flex items-center gap-2">
                    <Filter className="h-3 w-3" /> Category
                  </h4>
                  <Select
                    onValueChange={(value: CategoryFilter) => {
                      setFilterCategory(value);
                      setCurrentPage(1);
                    }}
                    value={filterCategory}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="office">Office Buildings</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DropdownMenuSeparator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-zinc-900 flex items-center gap-2">
                    <ArrowUpDown className="h-3 w-3" /> Price Range
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label
                        htmlFor="dropdown_min_price"
                        className="text-xs text-zinc-600"
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
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="dropdown_max_price"
                        className="text-xs text-zinc-600"
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
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-zinc-900 flex items-center gap-2">
                    <ArrowUpDown className="h-3 w-3" /> Downpayment Range
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label
                        htmlFor="dropdown_min_downpayment"
                        className="text-xs text-zinc-600"
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
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="dropdown_max_downpayment"
                        className="text-xs text-zinc-600"
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
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full h-9 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                      onClick={clearFilters}
                    >
                      Reset Filters
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            {/* Selection Tools */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {isSelectMode ? (
                <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-lg border border-zinc-200 animate-in fade-in slide-in-from-right-4 duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="h-8 text-xs font-medium text-zinc-700 hover:text-zinc-900 font-geist"
                  >
                    {selectedDesigns.size === designs.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>

                  <div className="h-4 w-px bg-zinc-300" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectMode}
                    className="h-8 w-8 p-0 hover:bg-zinc-200 rounded-md"
                  >
                    <X className="h-4 w-4 text-zinc-600" />
                  </Button>

                  {selectedDesigns.size > 0 && (
                    <>
                      <div className="h-4 w-px bg-zinc-300" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMultiDeleteClick}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 font-geist"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete ({selectedDesigns.size})
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={toggleSelectMode}
                  className="h-10 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-geist"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select
                </Button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs with Number Badges */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-6 px-6 md:mx-0 md:px-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setFilterCategory(category as CategoryFilter);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap font-geist border relative",
                  filterCategory === category
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                )}
              >
                <span className="flex items-center gap-2">
                  {formatCategoryDisplay(category)}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-5 px-1.5 text-xs font-medium rounded-full",
                      filterCategory === category
                        ? "bg-white/20 text-white/90 hover:bg-white/30"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    )}
                  >
                    {categoryCounts[category]?.toLocaleString() || 0}
                  </Badge>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {Array.from({ length: cardsPerPage }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-zinc-100 bg-white p-4 space-y-3 animate-pulse"
                >
                  <div className="bg-zinc-100 rounded-lg aspect-[4/3] w-full" />
                  <div className="space-y-2">
                    <div className="bg-zinc-100 h-4 w-3/4 rounded" />
                    <div className="bg-zinc-100 h-3 w-1/2 rounded" />
                  </div>
                  <div className="pt-2 flex justify-between">
                    <div className="bg-zinc-100 h-6 w-16 rounded-full" />
                    <div className="bg-zinc-100 h-6 w-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : designs.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
              <LayoutGrid className="h-8 w-8 text-zinc-300" />
            </div>
            <NotFound description="No designs found matching your criteria. Try adjusting the filters or publish your first design." />
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-4 font-geist border-zinc-200"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="px-10 overflow-y-auto mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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

            {/* Pagination Section */}
            <div className="my-6 px-6 p-10 border-gray-200">
              <Pagination>
                <PaginationContent className="font-geist">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={cn(
                        "font-geist text-sm",
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>

                  {getPageNumbers(totalPages, currentPage).map(
                    (page, index) => (
                      <PaginationItem key={index}>
                        {page === "ellipsis" ? (
                          <PaginationEllipsis className="font-geist" />
                        ) : (
                          <PaginationLink
                            onClick={() => setCurrentPage(page as number)}
                            isActive={currentPage === page}
                            className={cn(
                              "font-geist text-sm",
                              currentPage === page
                                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                                : "text-zinc-700 hover:bg-zinc-100"
                            )}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      className={cn(
                        "font-geist text-sm",
                        currentPage === totalPages &&
                          "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              {/* Page info */}
              <div className="text-center mt-4 text-sm text-zinc-600 font-geist">
                Page {currentPage} of {totalPages} •{" "}
                {totalCount.toLocaleString()} total designs
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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
