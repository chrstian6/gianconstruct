// components/admin/inventory/BatchItemForm.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Copy,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { ISupplier } from "@/types/supplier";
import { BatchForm, ItemForm } from "./AddItemModal";
import { useState } from "react";
import { CONSTRUCTION_UNITS } from "./constants";

interface BatchItemFormProps {
  batchForm: BatchForm;
  setBatchForm: React.Dispatch<React.SetStateAction<BatchForm>>;
  suppliers: ISupplier[];
  categories: string[];
  loadingSuppliers: boolean;
  loadingCategories: boolean;
  batchTotals: {
    totalCapital: number;
    totalValue: number;
    itemCount: number;
  };
  validBatchItemsCount: number;
}

export function BatchItemForm({
  batchForm,
  setBatchForm,
  suppliers,
  categories,
  loadingSuppliers,
  loadingCategories,
  batchTotals,
  validBatchItemsCount,
}: BatchItemFormProps) {
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const handleBatchSupplierChange = (value: string) => {
    setBatchForm((prev) => ({
      ...prev,
      supplier: value,
    }));
  };

  const handleBatchLocationChange = (value: string) => {
    setBatchForm((prev) => ({
      ...prev,
      location: value,
    }));
  };

  const handleBatchItemChange = (
    index: number,
    field: keyof ItemForm,
    value: string | number
  ) => {
    setBatchForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      return {
        ...prev,
        items: newItems,
      };
    });
  };

  const handleBatchUnitChange = (index: number, value: string) => {
    handleBatchItemChange(index, "unit", value);
  };

  const handleBatchCategoryChange = (index: number, value: string) => {
    if (value === "add_new") {
      setShowCustomCategory(true);
      handleBatchItemChange(index, "category", "");
    } else {
      setShowCustomCategory(false);
      handleBatchItemChange(index, "category", value);
    }
  };

  const addBatchItem = () => {
    setBatchForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          category: "",
          quantity: 0,
          unit: "",
          description: "",
          reorderPoint: 0,
          location: prev.location || "",
          unitCost: 0,
          salePrice: 0,
          isOpen: true,
        },
      ],
    }));
  };

  const removeBatchItem = (index: number) => {
    if (batchForm.items.length > 1) {
      setBatchForm((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const duplicateBatchItem = (index: number) => {
    const itemToDuplicate = batchForm.items[index];
    setBatchForm((prev) => ({
      ...prev,
      items: [
        ...prev.items.slice(0, index + 1),
        {
          ...itemToDuplicate,
          name: `${itemToDuplicate.name} (Copy)`,
          isOpen: true,
        },
        ...prev.items.slice(index + 1),
      ],
    }));
  };

  const toggleBatchItem = (index: number) => {
    setBatchForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        isOpen: !newItems[index].isOpen,
      };
      return {
        ...prev,
        items: newItems,
      };
    });
  };

  const handleCustomCategoryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setCustomCategory(value);
    setBatchForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({ ...item, category: value })),
    }));
  };

  const handleCancelCustomCategory = () => {
    setShowCustomCategory(false);
    setCustomCategory("");
    setBatchForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({ ...item, category: "" })),
    }));
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
      {/* Batch Header - Single Supplier for all items */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900 font-geist">
            Batch Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Batch Supplier */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Supplier for All Items *
            </Label>
            <Select
              value={batchForm.supplier}
              onValueChange={handleBatchSupplierChange}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select supplier for all items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a supplier</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem
                    key={supplier.supplier_id}
                    value={supplier.companyName}
                  >
                    {supplier.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600">
              This supplier will be applied to all items in this batch
            </p>
          </div>

          {/* Batch Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Default Storage Location
            </Label>
            <Input
              value={batchForm.location}
              onChange={(e) => handleBatchLocationChange(e.target.value)}
              placeholder="Optional: Default location for all items"
              className="bg-white"
            />
            <p className="text-xs text-gray-600">
              Default location that can be overridden per item
            </p>
          </div>
        </div>

        {/* Batch Summary */}
        {batchForm.supplier !== "none" && (
          <div className="mt-3 p-3 bg-white rounded border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Supplier:</span>
                <p className="font-medium">{batchForm.supplier}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Items:</span>
                <p className="font-medium">{validBatchItemsCount}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Capital:</span>
                <p className="font-medium">
                  ₱
                  {batchTotals.totalCapital.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Total Value:</span>
                <p className="font-medium">
                  ₱
                  {batchTotals.totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Batch Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium text-gray-900 font-geist">
            Items ({batchForm.items.length}) - {validBatchItemsCount} valid
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBatchItem}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {batchForm.items.map((item, index) => (
          <div
            key={index}
            className="border rounded-lg bg-white overflow-hidden"
          >
            {/* Item Header - Collapsible */}
            <div
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleBatchItem(index)}
            >
              <div className="flex items-center gap-3">
                {item.isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <div>
                  <h4 className="font-medium text-gray-900 font-geist">
                    Item {index + 1}
                    {item.name && (
                      <span className="text-gray-600 ml-2">- {item.name}</span>
                    )}
                  </h4>
                  {!item.isOpen && (
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      {item.category && <span>Category: {item.category}</span>}
                      {item.unit && <span>Unit: {item.unit}</span>}
                      {item.unitCost > 0 && (
                        <span>Base Price: ₱{item.unitCost}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateBatchItem(index);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {batchForm.items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBatchItem(index);
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Item Content - Collapsible */}
            {item.isOpen && (
              <div className="p-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Name */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Product Name *
                    </Label>
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        handleBatchItemChange(index, "name", e.target.value)
                      }
                      placeholder="Enter product name"
                      className="text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Category *</Label>
                    {showCustomCategory ? (
                      <div className="relative">
                        <Input
                          value={customCategory}
                          onChange={handleCustomCategoryChange}
                          placeholder="Enter new category"
                          className="text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={handleCancelCustomCategory}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <Select
                        value={item.category}
                        onValueChange={(value) =>
                          handleBatchCategoryChange(index, value)
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                          <SelectItem
                            value="add_new"
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-3 w-3" />
                            Add new category
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Quantity and Unit */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleBatchItemChange(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      min="0"
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Unit *</Label>
                    <Select
                      value={item.unit}
                      onValueChange={(value) =>
                        handleBatchUnitChange(index, value)
                      }
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {Object.entries(groupedUnits).map(
                          ([category, units]) => (
                            <div key={category}>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-100">
                                {category}
                              </div>
                              {units.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value}>
                                  {unit.label}
                                </SelectItem>
                              ))}
                            </div>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Base Price and Sale Price */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Base Price (₱) *
                    </Label>
                    <Input
                      type="number"
                      value={item.unitCost}
                      onChange={(e) =>
                        handleBatchItemChange(
                          index,
                          "unitCost",
                          Number(e.target.value)
                        )
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Sale Price (₱)
                    </Label>
                    <Input
                      type="number"
                      value={item.salePrice}
                      onChange={(e) =>
                        handleBatchItemChange(
                          index,
                          "salePrice",
                          Number(e.target.value)
                        )
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>

                  {/* Item-specific Location */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Item Location</Label>
                    <Input
                      value={item.location}
                      onChange={(e) =>
                        handleBatchItemChange(index, "location", e.target.value)
                      }
                      placeholder="Override default location"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Reorder Point</Label>
                    <Input
                      type="number"
                      value={item.reorderPoint}
                      onChange={(e) =>
                        handleBatchItemChange(
                          index,
                          "reorderPoint",
                          Number(e.target.value)
                        )
                      }
                      min="0"
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs font-medium">Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) =>
                        handleBatchItemChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Optional description"
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Item Summary */}
                {(item.quantity > 0 ||
                  item.unitCost > 0 ||
                  item.salePrice > 0) && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border text-xs">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {item.quantity > 0 && (
                        <div>
                          <span className="text-gray-600">Stock:</span>
                          <p className="font-medium">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                      )}
                      {item.unitCost > 0 && (
                        <div>
                          <span className="text-gray-600">Base Price:</span>
                          <p className="font-medium">
                            ₱{item.unitCost.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {item.salePrice > 0 && (
                        <div>
                          <span className="text-gray-600">Sale Price:</span>
                          <p className="font-medium">
                            ₱{item.salePrice.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {item.quantity > 0 && item.unitCost > 0 && (
                        <div>
                          <span className="text-gray-600">Total Capital:</span>
                          <p className="font-medium">
                            ₱{(item.quantity * item.unitCost).toFixed(2)}
                          </p>
                        </div>
                      )}
                      {item.quantity > 0 && item.salePrice > 0 && (
                        <div>
                          <span className="text-gray-600">Total Value:</span>
                          <p className="font-medium">
                            ₱{(item.quantity * item.salePrice).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
