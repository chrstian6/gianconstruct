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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDesign } from "@/action/designs";
import { toast } from "sonner";
import { Design } from "@/types/design";
import DesignDetails from "./DesignDetails";
import { useModalStore } from "@/lib/stores";
import EditingCatalog from "@/components/admin/catalog/EditingCatalog";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useSearchParams } from "next/navigation";

interface CatalogListProps {
  designs: Design[];
  onDelete: (id: string) => void;
  onUpdate: (updatedDesign: Design) => void;
}

export default function CatalogList({
  designs,
  onDelete,
  onUpdate,
}: CatalogListProps) {
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minRooms, setMinRooms] = useState<string>("");
  const [maxRooms, setMaxRooms] = useState<string>("");
  const { isDeleteDesignOpen, designIdToDelete, setIsDeleteDesignOpen } =
    useModalStore();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const cardsPerPage = 12;
  const searchParams = useSearchParams();

  useEffect(() => {
    const designId = searchParams.get("designId");
    if (designId) {
      const designToSelect = designs.find((d) => d.design_id === designId); // Changed from _id to design_id
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
    setIsDeleteDesignOpen(true, id);
  };

  const confirmDelete = async () => {
    if (!designIdToDelete) return;
    const result = await deleteDesign(designIdToDelete);
    if (result.success) {
      onDelete(designIdToDelete);
      if (selectedDesign?.design_id === designIdToDelete)
        setSelectedDesign(null); // Changed from _id to design_id
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

  if (editingDesign) {
    return (
      <EditingCatalog
        design={editingDesign}
        onCancel={() => setEditingDesign(null)}
        onUpdate={(updatedDesign) => {
          onUpdate(updatedDesign);
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
        onDelete={handleDelete}
        onEdit={() => setEditingDesign(selectedDesign)}
      />
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Design Catalog</h1>
          <p className="text-gray-600 mt-2">
            {filteredDesigns.length} designs available
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search designs..."
              className="pl-10 w-full border-gray-300 rounded-lg focus:border-[var(--orange)] focus:ring-[var(--orange)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-gray-300 rounded-lg hover:bg-gray-100"
              >
                <Filter className="h-5 w-5" />
                <span className="text-sm">Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-4 space-y-4 bg-white shadow-lg rounded-lg">
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
                className="w-full text-sm text-[var(--orange)] hover:bg-orange-50 rounded-lg"
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

      {filteredDesigns.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900">
            No designs found
          </h3>
          <p className="text-gray-600 mt-2">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedDesigns.map((design) => (
              <div
                key={design.design_id} // Changed from _id to design_id
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer"
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
                  <span className="absolute top-3 right-3 bg-[var(--orange)] text-white text-sm font-medium px-3 py-1 rounded-full">
                    {formatPrice(design.price)}
                  </span>
                  {design.isLoanOffer && (
                    <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full">
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
                          className="h-8 w-8 -mt-1 -mr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-40 bg-white shadow-lg rounded-lg"
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDesign(design);
                          }}
                          className="text-sm cursor-pointer hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(design.design_id); // Changed from _id to design_id
                          }}
                          className="text-sm text-red-600 cursor-pointer hover:bg-gray-100"
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
                      <Home className="h-5 w-5 text-[var(--orange)]" />
                      <span>{design.number_of_rooms} rooms</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-xs">
                      <Square className="h-5 w-5 text-[var(--orange)]" />
                      <span>{formatSquareMeters(design.square_meters)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="border-gray-300 rounded-full px-4 py-2 text-sm hover:bg-gray-100"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="border-gray-300 rounded-full px-4 py-2 text-sm hover:bg-gray-100"
            >
              Next
            </Button>
          </div>
        </>
      )}

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
