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
import { deleteDesign, getDesigns } from "@/action/designs";
import { toast } from "sonner";
import { Design } from "@/types/design";
import DesignDetails from "./DesignDetails";
import { useModalStore } from "@/lib/stores";
import EditingCatalog from "@/components/admin/catalog/EditingCatalog";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useSearchParams } from "next/navigation";
import CatalogForm from "@/components/admin/catalog/Form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function CatalogList() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minRooms, setMinRooms] = useState<string>("");
  const [maxRooms, setMaxRooms] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { isDeleteDesignOpen, designIdToDelete, setIsDeleteDesignOpen } =
    useModalStore();
  const cardsPerPage = 12;
  const searchParams = useSearchParams();

  // Fetch designs on mount
  useEffect(() => {
    async function fetchDesigns() {
      try {
        setIsLoading(true);
        const result = await getDesigns();

        if (!result) {
          toast.error("Failed to fetch designs: No response from server");
          setDesigns([]);
          return;
        }

        if (result.success && result.designs) {
          setDesigns(result.designs);
        } else {
          toast.error(result.error || "Failed to fetch designs");
          setDesigns([]);
        }
      } catch (error) {
        console.error("Error fetching designs:", error);
        toast.error("An unexpected error occurred while fetching designs");
        setDesigns([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDesigns();
  }, []);

  useEffect(() => {
    const designId = searchParams.get("designId");
    if (designId) {
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
    setDesigns(designs.filter((design: Design) => design.design_id !== id));
  };

  const handleUpdate = (updatedDesign: Design) => {
    setDesigns(
      designs.map((design) =>
        design.design_id === updatedDesign.design_id ? updatedDesign : design
      )
    );
  };

  const handleAddDesign = (design: Design) => {
    setDesigns([...designs, design]);
    setIsModalOpen(false);
    toast.success("Design added successfully!");
  };

  const handleDeleteClick = (id: string) => {
    setIsDeleteDesignOpen(true, id);
  };

  const confirmDelete = async () => {
    if (!designIdToDelete) return;
    const result = await deleteDesign(designIdToDelete);
    if (result.success) {
      handleDelete(designIdToDelete);
      if (selectedDesign?.design_id === designIdToDelete)
        setSelectedDesign(null);
      toast.success("Design deleted successfully!");
    } else {
      toast.error(result.error || "Failed to delete design");
    }
    setIsDeleteDesignOpen(false);
  };

  const filteredDesigns = designs.filter((design) => {
    const matchesCategory =
      filterCategory === "all" ||
      design.category.toLowerCase().includes(filterCategory.toLowerCase());
    const matchesMinPrice = minPrice
      ? design.price >= parseFloat(minPrice.replace(/,/g, ""))
      : true;
    const matchesMaxPrice = maxPrice
      ? design.price <= parseFloat(maxPrice.replace(/,/g, ""))
      : true;
    const matchesMinRooms = minRooms
      ? design.number_of_rooms >= parseInt(minRooms.replace(/,/g, ""))
      : true;
    const matchesMaxRooms = maxRooms
      ? design.number_of_rooms <= parseInt(maxRooms.replace(/,/g, ""))
      : true;
    const matchesSearch = searchQuery
      ? design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return (
      matchesCategory &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesMinRooms &&
      matchesMaxRooms &&
      matchesSearch
    );
  });

  const totalPages = Math.ceil(filteredDesigns.length / cardsPerPage);
  const paginatedDesigns = filteredDesigns.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  const formatNumberWithCommas = (value: string): string => {
    const numeric = value.replace(/[^0-9]/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

  if (selectedDesign) {
    return (
      <DesignDetails
        design={selectedDesign}
        onBack={() => setSelectedDesign(null)}
        onDelete={handleDeleteClick}
        onEdit={() => setEditingDesign(selectedDesign)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">
              Design Catalog
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              {isLoading
                ? "Loading..."
                : `${filteredDesigns.length} designs available`}
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Design
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search designs..."
                className="pl-10 w-full border-gray-300 rounded-lg focus:border-gray-500 focus:ring-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <Filter className="h-5 w-5" />
                  <span className="text-sm">Filters</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-4 space-y-4 bg-white shadow-lg rounded-lg border border-gray-200">
                <div>
                  <Label
                    htmlFor="dropdown_category_filter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category
                  </Label>
                  <Select
                    onValueChange={setFilterCategory}
                    value={filterCategory}
                  >
                    <SelectTrigger
                      id="dropdown_category_filter"
                      className="w-full border-gray-300 rounded-lg"
                    >
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="dropdown_min_price"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Min Price
                    </Label>
                    <Input
                      id="dropdown_min_price"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) =>
                        setMinPrice(formatNumberWithCommas(e.target.value))
                      }
                      className="w-full border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="dropdown_max_price"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Max Price
                    </Label>
                    <Input
                      id="dropdown_max_price"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) =>
                        setMaxPrice(formatNumberWithCommas(e.target.value))
                      }
                      className="w-full border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="dropdown_min_rooms"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Min Rooms
                    </Label>
                    <Input
                      id="dropdown_min_rooms"
                      placeholder="Min"
                      value={minRooms}
                      onChange={(e) =>
                        setMinRooms(formatNumberWithCommas(e.target.value))
                      }
                      className="w-full border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="dropdown_max_rooms"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Max Rooms
                    </Label>
                    <Input
                      id="dropdown_max_rooms"
                      placeholder="Max"
                      value={maxRooms}
                      onChange={(e) =>
                        setMaxRooms(formatNumberWithCommas(e.target.value))
                      }
                      className="w-full border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200"
                  onClick={() => {
                    setFilterCategory("all");
                    setMinPrice("");
                    setMaxPrice("");
                    setMinRooms("");
                    setMaxRooms("");
                  }}
                >
                  Clear Filters
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Scrollable Content Section with Cards and Pagination */}
      <div className="flex-1 overflow-y-auto">
        {filteredDesigns.length === 0 ? (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900">
                No designs found
              </h3>
              <p className="text-gray-600 mt-2">
                Try adjusting your filters or search query
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedDesigns.map((design) => (
                <div
                  key={design.design_id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedDesign(design)}
                >
                  <div className="relative">
                    {design.images.length > 0 ? (
                      <div className="relative aspect-video bg-gray-100">
                        <img
                          src={design.images[0]}
                          alt={design.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <span className="absolute top-3 right-3 bg-gray-900 text-white text-sm font-medium px-3 py-1 rounded-full">
                      {formatPrice(design.price)}
                    </span>
                    {design.isLoanOffer && (
                      <span className="absolute top-3 left-3 bg-gray-700 text-white text-xs font-medium px-2 py-1 rounded-full">
                        ₱
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {capitalizeFirstLetter(design.name)}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mt-1 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 bg-white shadow-lg rounded-lg border border-gray-200"
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDesign(design);
                            }}
                            className="text-sm cursor-pointer text-gray-700 hover:bg-gray-100"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(design.design_id);
                            }}
                            className="text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                      {design.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-6">
                      <div className="flex items-center gap-2 text-gray-600 text-xs">
                        <Home className="h-5 w-5 text-gray-600" />
                        <span>{design.number_of_rooms} rooms</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-xs">
                        <Square className="h-5 w-5 text-gray-600" />
                        <span>{formatSquareMeters(design.square_meters)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Section - Below Cards */}
            <div className="my-6 px-6 p-10 border-gray-200">
              <Pagination>
                <PaginationContent>
                  {totalPages > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  )}
                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => setCurrentPage(page as number)}
                          isActive={currentPage === page}
                          className={
                            currentPage === page
                              ? "bg-gray-900 text-white hover:bg-gray-800"
                              : "text-gray-700 hover:bg-gray-100"
                          }
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  {totalPages > 1 && (
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>

      {/* Add Design Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Plus className="h-5 w-5" />
              Add New Design
            </DialogTitle>
            <DialogDescription className="text-gray-600">
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
    </div>
  );
}
