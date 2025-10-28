// components/admin/inventory/SingleItemForm.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";
import { ISupplier } from "@/types/supplier";
import { ItemForm } from "./AddItemModal";
import { useState } from "react";
import { CONSTRUCTION_UNITS } from "@/components/admin/inventory/constants";

interface SingleItemFormProps {
  singleItem: ItemForm & { supplier: string };
  setSingleItem: React.Dispatch<
    React.SetStateAction<ItemForm & { supplier: string }>
  >;
  suppliers: ISupplier[];
  categories: string[];
  loadingSuppliers: boolean;
  loadingCategories: boolean;
  calculatedSingleTotalCapital: number;
}

export function SingleItemForm({
  singleItem,
  setSingleItem,
  suppliers,
  categories,
  loadingSuppliers,
  loadingCategories,
  calculatedSingleTotalCapital,
}: SingleItemFormProps) {
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const handleSingleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSingleItem((prev) => ({
      ...prev,
      [name]:
        name === "quantity" ||
        name === "reorderPoint" ||
        name === "unitCost" ||
        name === "salePrice"
          ? Number(value)
          : value,
    }));
  };

  const handleSingleUnitChange = (value: string) => {
    setSingleItem((prev) => ({
      ...prev,
      unit: value,
    }));
  };

  const handleSingleSupplierChange = (value: string) => {
    setSingleItem((prev) => ({
      ...prev,
      supplier: value,
    }));
  };

  const handleSingleCategoryChange = (value: string) => {
    if (value === "add_new") {
      setShowCustomCategory(true);
      setSingleItem((prev) => ({ ...prev, category: "" }));
    } else {
      setShowCustomCategory(false);
      setSingleItem((prev) => ({ ...prev, category: value }));
    }
  };

  const handleCustomCategoryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setCustomCategory(value);
    setSingleItem((prev) => ({ ...prev, category: value }));
  };

  const handleCancelCustomCategory = () => {
    setShowCustomCategory(false);
    setCustomCategory("");
    setSingleItem((prev) => ({ ...prev, category: "" }));
  };

  // Group units by category for better organization
  const groupedUnits = CONSTRUCTION_UNITS.reduce(
    (acc, unit) => {
      if (!acc[unit.category]) {
        acc[unit.category] = [];
      }
      acc[unit.category].push(unit);
      return acc;
    },
    {} as Record<string, typeof CONSTRUCTION_UNITS>
  );

  return (
    <div className="space-y-6">
      {/* Name and Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-gray-900 font-geist"
            >
              Product Name
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Enter the descriptive name of the product as it will appear in
                  your inventory lists and reports.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="name"
            name="name"
            value={singleItem.name}
            onChange={handleSingleChange}
            placeholder="e.g., 2x4 Lumber, Concrete Mix, Paint Brush"
            className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
            required
          />
          <p className="text-xs text-gray-600 font-geist">
            Example: 2x4 Lumber, Concrete Mix, Paint Brush
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="category"
              className="text-sm font-medium text-gray-900 font-geist"
            >
              Category
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Select an existing category or add a new one for better
                  organization.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {showCustomCategory ? (
            <div className="relative">
              <Input
                id="customCategory"
                value={customCategory}
                onChange={handleCustomCategoryChange}
                placeholder="Enter new category name"
                className="py-2.5 px-3.5 pr-10 bg-white border-gray-300 focus:ring-gray-500 font-geist"
              />
              <button
                type="button"
                onClick={handleCancelCustomCategory}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Select
              value={singleItem.category}
              onValueChange={handleSingleCategoryChange}
            >
              <SelectTrigger className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist">
                <SelectValue
                  placeholder={
                    loadingCategories
                      ? "Loading categories..."
                      : "Select category..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
                {categories.length === 0 && !loadingCategories && (
                  <SelectItem value="no-categories" disabled>
                    No categories found
                  </SelectItem>
                )}
                <SelectItem
                  value="add_new"
                  className="flex items-center gap-2 text-blue-600 focus:text-blue-600"
                >
                  <Info className="h-4 w-4" />
                  Add new category
                </SelectItem>
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-gray-600 font-geist">
            Example: Lumber, Fasteners, Tools, Electrical
          </p>
        </div>
      </div>

      {/* Quantity and Unit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="quantity"
              className="text-sm font-medium text-gray-900 font-geist"
            >
              Initial Quantity
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Enter the starting quantity of this product in your inventory.
                  Use 0 if adding for future use.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="quantity"
            type="number"
            name="quantity"
            value={singleItem.quantity}
            onChange={handleSingleChange}
            min="0"
            placeholder="0"
            className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
          />
          <p className="text-xs text-gray-600 font-geist">
            Current stock level for this product
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="unit"
              className="text-sm font-medium text-gray-900 font-geist"
            >
              Unit of Measurement
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Select the appropriate unit of measurement for this
                  construction product.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={singleItem.unit}
            onValueChange={handleSingleUnitChange}
          >
            <SelectTrigger className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist">
              <SelectValue placeholder="Select unit..." />
            </SelectTrigger>
            <SelectContent className="max-h-96">
              {Object.entries(groupedUnits).map(([category, units]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase bg-gray-100">
                    {category}
                  </div>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-600 font-geist">
            Choose from construction-specific measurement units
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="description"
            className="text-sm font-medium text-gray-900 font-geist"
          >
            Product Description
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Add detailed specifications, quality notes, or any special
                characteristics of this product.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Textarea
          id="description"
          name="description"
          value={singleItem.description}
          onChange={handleSingleChange}
          placeholder="Optional: Specifications, quality notes, dimensions, or special characteristics..."
          rows={3}
          className="bg-white border-gray-300 focus:ring-gray-500 font-geist"
        />
        <p className="text-xs text-gray-600 font-geist">
          Helpful for identifying specific variants or quality levels
        </p>
      </div>

      {/* Supplier Information */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="supplier"
            className="text-sm font-medium text-gray-900 font-geist"
          >
            Primary Supplier
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Select the main supplier for this product from your active
                suppliers list.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Select
          value={singleItem.supplier}
          onValueChange={handleSingleSupplierChange}
        >
          <SelectTrigger className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist">
            <SelectValue
              placeholder={
                loadingSuppliers ? "Loading suppliers..." : "Select supplier..."
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (No supplier)</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem
                key={supplier.supplier_id}
                value={supplier.companyName}
              >
                {supplier.companyName}
              </SelectItem>
            ))}
            {suppliers.length === 0 && !loadingSuppliers && (
              <SelectItem value="no-suppliers" disabled>
                No active suppliers found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-600 font-geist">
          {loadingSuppliers
            ? "Loading active suppliers..."
            : suppliers.length > 0
              ? `Choose from ${suppliers.length} active suppliers`
              : "No active suppliers available. Add suppliers first."}
        </p>
      </div>

      {/* Base Price, Sale Price and Reorder Point */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="unitCost"
              className="text-sm font-medium text-gray-900 font-geist"
            >
              Base Price
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Enter the cost per unit. This is used for inventory valuation
                  and cost tracking.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-geist">
              ₱
            </span>
            <Input
              id="unitCost"
              type="number"
              name="unitCost"
              value={singleItem.unitCost}
              onChange={handleSingleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="py-2.5 pl-8 pr-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
              required
            />
          </div>
          <p className="text-xs text-gray-600 font-geist">
            Cost per unit for inventory valuation
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="salePrice"
              className="text-sm font-medium text-gray-900 font-geist"
            >
              Sale Price
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Enter the selling price per unit. This is used for sales and
                  profit calculation.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-geist">
              ₱
            </span>
            <Input
              id="salePrice"
              type="number"
              name="salePrice"
              value={singleItem.salePrice}
              onChange={handleSingleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="py-2.5 pl-8 pr-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
            />
          </div>
          <p className="text-xs text-gray-600 font-geist">
            Selling price per unit
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="reorderPoint"
              className="text-sm font-medium text-gray-900 font-geist"
            >
              Reorder Point
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Set the minimum quantity that triggers a reorder alert. Helps
                  prevent stockouts.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="reorderPoint"
            type="number"
            name="reorderPoint"
            value={singleItem.reorderPoint}
            onChange={handleSingleChange}
            min="0"
            placeholder="0"
            className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
          />
          <p className="text-xs text-gray-600 font-geist">
            Alert when stock falls below this level
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="location"
            className="text-sm font-medium text-gray-900 font-geist"
          >
            Storage Location
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Specify where this product is stored (shelf, bin, room, or
                warehouse location).
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          id="location"
          name="location"
          value={singleItem.location}
          onChange={handleSingleChange}
          placeholder="Optional: Shelf A5, Bin 12, Warehouse North"
          className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
        />
        <p className="text-xs text-gray-600 font-geist">
          Example: Shelf A5, Bin 12, Warehouse North
        </p>
      </div>

      {/* Summary Card */}
      {(singleItem.quantity > 0 ||
        singleItem.unitCost > 0 ||
        singleItem.salePrice > 0) && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium mb-3 text-blue-900 font-geist flex items-center gap-2">
            <Info className="h-4 w-4" />
            Inventory Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {singleItem.quantity > 0 && (
              <div>
                <span className="text-blue-700 font-geist">Initial Stock:</span>
                <p className="font-medium text-blue-900 font-geist">
                  {singleItem.quantity.toLocaleString()}{" "}
                  {singleItem.unit || "units"}
                </p>
              </div>
            )}
            {singleItem.unitCost > 0 && (
              <div>
                <span className="text-blue-700 font-geist">Base Price:</span>
                <p className="font-medium text-blue-900 font-geist">
                  ₱
                  {singleItem.unitCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}
            {singleItem.salePrice > 0 && (
              <div>
                <span className="text-blue-700 font-geist">Sale Price:</span>
                <p className="font-medium text-blue-900 font-geist">
                  ₱
                  {singleItem.salePrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}
            {singleItem.quantity > 0 && singleItem.unitCost > 0 && (
              <div>
                <span className="text-blue-700 font-geist">Total Capital:</span>
                <p className="font-medium text-blue-900 font-geist">
                  ₱
                  {calculatedSingleTotalCapital.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}
            {singleItem.quantity > 0 && singleItem.salePrice > 0 && (
              <div>
                <span className="text-blue-700 font-geist">Total Value:</span>
                <p className="font-medium text-blue-900 font-geist">
                  ₱
                  {(singleItem.quantity * singleItem.salePrice).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>
              </div>
            )}
            {singleItem.reorderPoint > 0 && (
              <div>
                <span className="text-blue-700 font-geist">Reorder Alert:</span>
                <p className="font-medium text-blue-900 font-geist">
                  When stock drops below {singleItem.reorderPoint}{" "}
                  {singleItem.unit || "units"}
                </p>
              </div>
            )}
            {singleItem.supplier && singleItem.supplier !== "none" && (
              <div>
                <span className="text-blue-700 font-geist">
                  Selected Supplier:
                </span>
                <p className="font-medium text-blue-900 font-geist">
                  {singleItem.supplier}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
