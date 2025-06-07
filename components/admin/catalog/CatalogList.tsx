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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { deleteDesign } from "@/action/designs";
import { toast } from "sonner";
import { Design } from "@/types/design";

interface CatalogListProps {
  designs: Design[];
  onDelete: (id: string) => void;
  onAddTemplate: () => void;
}

export default function CatalogList({
  designs,
  onDelete,
  onAddTemplate,
}: CatalogListProps) {
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Format price with commas and peso sign
  const formatPrice = (price: number): string => {
    return `₱${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Format square meters with commas
  const formatSquareMeters = (square_meters: number): string => {
    return `${square_meters.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} sqm`;
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    const result = await deleteDesign(id);
    if (result.success) {
      onDelete(id);
      if (selectedDesign?._id === id) setSelectedDesign(null);
      toast.success("Design deleted successfully!");
    } else {
      toast.error(result.error || "Failed to delete design");
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

  if (selectedDesign) {
    return (
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedDesign(null)}
          className="mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Catalog
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{selectedDesign.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Design ID: {selectedDesign.design_id}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {selectedDesign.images.map((url: string, index: number) => (
                <img
                  key={index}
                  src={url}
                  alt={`${selectedDesign.name} ${index}`}
                  className="w-full h-48 object-cover rounded"
                />
              ))}
            </div>
            <p className="text-sm mb-2">{selectedDesign.description}</p>
            <p className="text-sm">
              Category: {selectedDesign.category || "Unknown"}
            </p>
            <p className="text-sm font-semibold">
              {formatPrice(selectedDesign.price)}
            </p>
            <p className="text-sm">Rooms: {selectedDesign.number_of_rooms}</p>
            <p className="text-sm">
              Area: {formatSquareMeters(selectedDesign.square_meters)}
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="mt-4 text-sm h-8"
              onClick={() => handleDelete(selectedDesign._id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 mt-4">
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
      {/* Catalog List */}
      <div className="w-full md:w-3/4 p-4">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
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
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-sm text-muted-600 mb-4">
                      No templates available
                    </p>
                    <Button
                      onClick={onAddTemplate}
                      className="bg-text-primary text-white rounded-md text-sm h-8"
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
                  className="cursor-pointer"
                  onClick={() => setSelectedDesign(design)}
                >
                  <TableCell className="py-2 text-xs">
                    {design.design_id}
                  </TableCell>
                  <TableCell className="py-2 text-xs">{design.name}</TableCell>
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
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(design._id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
