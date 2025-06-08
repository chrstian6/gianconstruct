import React, { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Pencil,
  X,
  MoreHorizontal,
} from "lucide-react";
import { deleteDesign, updateDesign } from "@/action/designs";
import { toast } from "sonner";
import { Design } from "@/types/design";
import DesignDetails from "./DesignDetails";
import { useModalStore } from "@/lib/stores";

interface CatalogListProps {
  designs: Design[];
  onDelete: (id: string) => void;
  onAddTemplate: () => void;
  onUpdate: (updatedDesign: Design) => void;
}

export default function CatalogList({
  designs,
  onDelete,
  onAddTemplate,
  onUpdate,
}: CatalogListProps) {
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const { isDeleteDesignOpen, designIdToDelete, setIsDeleteDesignOpen } =
    useModalStore();

  // Format price with commas and peso sign
  const formatPrice = (price: number): string => {
    return `₱${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Format square meters with commas
  const formatSquareMeters = (square_meters: number): string => {
    return `${square_meters.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} sqm`;
  };

  // Handle delete confirmation
  const handleDelete = (id: string) => {
    setIsDeleteDesignOpen(true, id);
  };

  const confirmDelete = async () => {
    if (!designIdToDelete) return;
    const result = await deleteDesign(designIdToDelete);
    if (result.success) {
      onDelete(designIdToDelete);
      if (selectedDesign?._id === designIdToDelete) setSelectedDesign(null);
      toast.success("Design deleted successfully!");
    } else {
      toast.error(result.error || "Failed to delete design");
    }
    setIsDeleteDesignOpen(false);
  };

  // Handle image deletion
  const handleDeleteImage = (index: number) => {
    if (!editingDesign) return;
    const newImages = editingDesign.images.filter((_, i) => i !== index);
    console.log(`Deleting image at index ${index}. New images:`, newImages);
    setEditingDesign({
      ...editingDesign,
      images: newImages,
    });
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDesign) return;

    const formData = new FormData(e.currentTarget);
    console.log(
      "Existing Images Before Form Submission:",
      editingDesign.images
    );
    formData.append("existingImages", JSON.stringify(editingDesign.images));
    const result = await updateDesign(editingDesign._id, formData);
    if (result.success && result.design) {
      onUpdate(result.design);
      setEditingDesign(null);
      setSelectedDesign(result.design);
      toast.success("Design updated successfully!");
    } else {
      toast.error(result.error || "Failed to update design");
    }
  };

  // Filter designs
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
    return matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  // Format number with commas
  const formatNumberWithCommas = (value: string): string => {
    const numeric = value.replace(/[^0-9]/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (editingDesign) {
    return (
      <>
        <div className="p-4 max-w-full mx-auto">
          <div className="bg-white py-4">
            <Button
              variant="ghost"
              onClick={() => setEditingDesign(null)}
              className="mb-4 text-sm flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details Design
            </Button>
            <h2 className="text-2xl font-semibold text-center">
              Edit Design: {editingDesign.name}
            </h2>
          </div>
          <hr className="my-6 border-t border-gray-200" />
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-6 p-4">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingDesign.name}
                className="text-sm h-8"
                required
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-semibold">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                defaultValue={editingDesign.description}
                className="text-sm h-8"
                required
              />
            </div>
            <div>
              <Label htmlFor="price" className="text-sm font-semibold">
                Price (₱)
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                defaultValue={editingDesign.price}
                className="text-sm h-8"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <Label
                htmlFor="number_of_rooms"
                className="text-sm font-semibold"
              >
                Number of Rooms
              </Label>
              <Input
                id="number_of_rooms"
                name="number_of_rooms"
                type="number"
                defaultValue={editingDesign.number_of_rooms}
                className="text-sm h-8"
                min="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="square_meters" className="text-sm font-semibold">
                Area (sqm)
              </Label>
              <Input
                id="square_meters"
                name="square_meters"
                type="number"
                defaultValue={editingDesign.square_meters}
                className="text-sm h-8"
                min="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-sm font-semibold">
                Category
              </Label>
              <Select
                name="category"
                defaultValue={editingDesign.category || "commercial"}
              >
                <SelectTrigger id="category" className="text-sm h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="office">Office Buildings</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold">Current Images</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {editingDesign.images.map((url: string, index: number) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Current image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleDeleteImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="images" className="text-sm font-semibold">
                Upload New Images
              </Label>
              <Input
                id="images"
                name="images"
                type="file"
                multiple
                accept="image/*"
                className="text-sm h-8"
              />
            </div>
            <hr className="my-6 border-t border-gray-200" />
            <div className="flex justify-center gap-4">
              <Button type="submit" className="text-sm h-8">
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-sm h-8"
                onClick={() => setEditingDesign(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
        {/* Delete Confirmation Modal */}
        <AlertDialog
          open={isDeleteDesignOpen}
          onOpenChange={setIsDeleteDesignOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this design? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDesignOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
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
    <>
      <div className="flex flex-col md:flex-row gap-4 mt-4 p-4">
        {/* Filter Panel */}
        <div className="w-full md:w-1/4 border-r border-gray-200 p-4">
          <h3 className="text-sm font-semibold mb-3">Filters</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="category_filter" className="text-xs">
                Category
              </Label>
              <Select onValueChange={setFilterCategory} value={filterCategory}>
                <SelectTrigger
                  id="category_filter"
                  className="rounded-none text-sm h-8"
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="office">Office Buildings</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="min_price" className="text-xs">
                Min Price (₱)
              </Label>
              <Input
                id="min_price"
                type="text"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice(formatNumberWithCommas(e.target.value))
                }
                placeholder="Min price"
                className="rounded-none text-sm h-8"
              />
            </div>
            <div>
              <Label htmlFor="max_price" className="text-xs">
                Max Price (₱)
              </Label>
              <Input
                id="max_price"
                type="text"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(formatNumberWithCommas(e.target.value))
                }
                placeholder="Max price"
                className="rounded-none text-sm h-8"
              />
            </div>
          </div>
        </div>
        <hr className="my-6 border-t border-gray-200 md:hidden" />
        {/* Catalog List */}
        <div className="w-full md:w-3/4 p-4">
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="border border-gray-200 border-1">
                <TableHead className="text-xs py-2">Design ID</TableHead>
                <TableHead className="text-xs py-2">Name</TableHead>
                <TableHead className="text-xs py-2">Category</TableHead>
                <TableHead className="text-xs py-2">Price</TableHead>
                <TableHead className="text-xs py-2">Rooms</TableHead>
                <TableHead className="text-xs py-2">Area</TableHead>
                <TableHead className="text-xs py-2">Images</TableHead>
                <TableHead className="text-xs py-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDesigns.length === 0 ? (
                <TableRow className="border border-gray-200 border-1">
                  <TableCell colSpan={8} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        No templates available
                      </p>
                      <Button
                        onClick={onAddTemplate}
                        className="bg-text-secondary text-white hover:bg-text-secondary/90 rounded-none text-sm h-8"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Template
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDesigns.map((design: Design) => (
                  <TableRow
                    key={design._id}
                    className="cursor-pointer border border-gray-200 border-1"
                    onClick={() => setSelectedDesign(design)}
                  >
                    <TableCell className="py-2 text-xs">
                      {design.design_id}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {design.name}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {design.category || "Unknown"}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {formatPrice(design.price)}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {design.number_of_rooms}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {formatSquareMeters(design.square_meters)}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {design.images.length > 0 ? (
                        <img
                          src={design.images[0]}
                          alt={`${design.name} thumbnail`}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        "No images"
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(design._id);
                            }}
                            className="text-sm text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <hr className="my-6 border-t border-gray-200" />
      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={isDeleteDesignOpen}
        onOpenChange={setIsDeleteDesignOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this design? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDesignOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
