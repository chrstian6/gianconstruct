"use client";

import { useState, useEffect } from "react";
import { ProjectModalLayout } from "@/components/admin/projects/ProjectModalLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useModalStore } from "@/lib/stores";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, Plus, X } from "lucide-react";
import { getSuppliers } from "@/action/supplier";
import { getCategories } from "@/action/inventory";
import { ISupplier } from "@/types/supplier";
import { IInventory } from "@/types/Inventory";

interface EditItemModalProps {
  item: IInventory;
  onUpdate: (
    product_id: string,
    data: {
      name: string;
      category: string;
      quantity: number;
      unit: string;
      description?: string;
      supplier?: string;
      reorderPoint: number;
      location?: string;
      unitCost: number;
    }
  ) => void;
}

const CONSTRUCTION_UNITS = [
  { value: "kg", label: "Kilograms (kg)", category: "Weight" },
  { value: "g", label: "Grams (g)", category: "Weight" },
  { value: "tons", label: "Metric Tons", category: "Weight" },
  { value: "lbs", label: "Pounds (lbs)", category: "Weight" },
  { value: "m³", label: "Cubic Meters (m³)", category: "Volume" },
  { value: "cm³", label: "Cubic Centimeters (cm³)", category: "Volume" },
  { value: "L", label: "Liters (L)", category: "Volume" },
  { value: "mL", label: "Milliliters (mL)", category: "Volume" },
  { value: "gal", label: "Gallons (gal)", category: "Volume" },
  { value: "bags", label: "Bags", category: "Volume" },
  { value: "drums", label: "Drums", category: "Volume" },
  { value: "m", label: "Meters (m)", category: "Length" },
  { value: "cm", label: "Centimeters (cm)", category: "Length" },
  { value: "mm", label: "Millimeters (mm)", category: "Length" },
  { value: "km", label: "Kilometers (km)", category: "Length" },
  { value: "ft", label: "Feet (ft)", category: "Length" },
  { value: "in", label: "Inches (in)", category: "Length" },
  { value: "yd", label: "Yards (yd)", category: "Length" },
  { value: "m²", label: "Square Meters (m²)", category: "Area" },
  { value: "cm²", label: "Square Centimeters (cm²)", category: "Area" },
  { value: "mm²", label: "Square Millimeters (mm²)", category: "Area" },
  { value: "ft²", label: "Square Feet (ft²)", category: "Area" },
  { value: "in²", label: "Square Inches (in²)", category: "Area" },
  { value: "yd²", label: "Square Yards (yd²)", category: "Area" },
  { value: "hectares", label: "Hectares", category: "Area" },
  { value: "acres", label: "Acres", category: "Area" },
  { value: "pcs", label: "Pieces (pcs)", category: "Count" },
  { value: "units", label: "Units", category: "Count" },
  { value: "packs", label: "Packs", category: "Count" },
  { value: "bundles", label: "Bundles", category: "Count" },
  { value: "rolls", label: "Rolls", category: "Count" },
  { value: "sheets", label: "Sheets", category: "Count" },
  { value: "panels", label: "Panels", category: "Count" },
  { value: "blocks", label: "Blocks", category: "Count" },
  { value: "tiles", label: "Tiles", category: "Count" },
  { value: "hours", label: "Hours", category: "Time" },
  { value: "days", label: "Days", category: "Time" },
  { value: "weeks", label: "Weeks", category: "Time" },
  { value: "months", label: "Months", category: "Time" },
  { value: "set", label: "Set", category: "Special" },
  { value: "kit", label: "Kit", category: "Special" },
  { value: "pair", label: "Pair", category: "Special" },
  { value: "lot", label: "Lot", category: "Special" },
  { value: "pallet", label: "Pallet", category: "Special" },
  { value: "skid", label: "Skid", category: "Special" },
];

export function EditItemModal({ item, onUpdate }: EditItemModalProps) {
  const { isEditInventoryOpen, setIsEditInventoryOpen } = useModalStore();
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const [form, setForm] = useState({
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    description: item.description || "",
    supplier: item.supplier || "",
    reorderPoint: item.reorderPoint,
    location: item.location || "",
    unitCost: item.unitCost,
    totalCost: item.quantity * item.unitCost,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (isEditInventoryOpen) {
        try {
          setLoadingSuppliers(true);
          setLoadingCategories(true);

          const supplierData = await getSuppliers();
          const activeSuppliers = supplierData.filter(
            (supplier) => supplier.status === "active"
          );
          setSuppliers(activeSuppliers);

          const categoryData = await getCategories();
          setCategories(categoryData);
        } catch (error) {
          console.error("Failed to fetch data:", error);
        } finally {
          setLoadingSuppliers(false);
          setLoadingCategories(false);
        }
      }
    };

    fetchData();
  }, [isEditInventoryOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const newForm = {
        ...prev,
        [name]:
          name === "quantity" ||
          name === "reorderPoint" ||
          name === "unitCost" ||
          name === "totalCost"
            ? Number(value)
            : value,
      };

      // If totalCost changes, recalculate unitCost
      if (name === "totalCost" && newForm.quantity > 0) {
        newForm.unitCost = Number(
          (newForm.totalCost / newForm.quantity).toFixed(2)
        );
      }
      // If quantity or unitCost changes, recalculate totalCost
      if (name === "quantity" || name === "unitCost") {
        newForm.totalCost = Number(
          (newForm.quantity * newForm.unitCost).toFixed(2)
        );
      }

      return newForm;
    });
  };

  const handleUnitChange = (value: string) => {
    setForm((prev) => ({ ...prev, unit: value }));
  };

  const handleSupplierChange = (value: string) => {
    const selectedSupplier = suppliers.find(
      (supplier) => supplier.supplier_id === value
    );
    setForm((prev) => ({
      ...prev,
      supplier: selectedSupplier ? selectedSupplier.companyName : "",
    }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === "add_new") {
      setShowCustomCategory(true);
      setForm((prev) => ({ ...prev, category: "" }));
    } else {
      setShowCustomCategory(false);
      setForm((prev) => ({ ...prev, category: value }));
    }
  };

  const handleCustomCategoryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setCustomCategory(value);
    setForm((prev) => ({ ...prev, category: value }));
  };

  const handleCancelCustomCategory = () => {
    setShowCustomCategory(false);
    setCustomCategory("");
    setForm((prev) => ({ ...prev, category: item.category }));
  };

  const handleSubmit = () => {
    const itemData = {
      name: form.name,
      category: form.category,
      quantity: form.quantity,
      unit: form.unit,
      description: form.description || undefined,
      supplier: form.supplier || undefined,
      reorderPoint: form.reorderPoint,
      location: form.location || undefined,
      unitCost: form.unitCost,
    };

    // Use product_id instead of item_id and pass item.product_id
    onUpdate(item.product_id, itemData);
  };

  const handleCancel = () => {
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      description: item.description || "",
      supplier: item.supplier || "",
      reorderPoint: item.reorderPoint,
      location: item.location || "",
      unitCost: item.unitCost,
      totalCost: item.quantity * item.unitCost,
    });
    setShowCustomCategory(false);
    setCustomCategory("");
    setIsEditInventoryOpen(false, null);
  };

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
    <TooltipProvider>
      <ProjectModalLayout
        open={isEditInventoryOpen}
        onOpenChange={(open) =>
          setIsEditInventoryOpen(open, open ? item : null)
        }
        title="Edit Inventory Item"
        description="Update the item details below. All fields with detailed descriptions to help you provide accurate information."
        footerActions={
          <>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 min-w-[120px] order-2 sm:order-1 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full font-geist"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.name || !form.category || !form.unit || form.unitCost <= 0
              }
              className="flex-1 min-w-[120px] order-1 sm:order-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-geist disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Update Item
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900 font-geist">
                Product ID
              </Label>
              <Input
                value={item.product_id}
                disabled
                className="py-2.5 px-3.5 bg-gray-100 border-gray-300 font-mono text-xs font-geist"
              />
              <p className="text-xs text-gray-600 font-geist">
                Unique identifier in xxxx-xxxx format (cannot be changed)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-900 font-geist"
                >
                  Item Name
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Enter the descriptive name of the item as it will appear
                      in your inventory lists and reports.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
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
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Select
                  value={form.category}
                  onValueChange={handleCategoryChange}
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
                      <SelectItem value="none" disabled>
                        No categories found
                      </SelectItem>
                    )}
                    <SelectItem
                      value="add_new"
                      className="flex items-center gap-2 text-blue-600 focus:text-blue-600"
                    >
                      <Plus className="h-4 w-4" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="quantity"
                  className="text-sm font-medium text-gray-900 font-geist"
                >
                  Quantity
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Update the current quantity of this item in your
                      inventory.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="quantity"
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="unit"
                  className="text-sm font-medium text-gray-900 font-geist"
                >
                  Unit
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Select the appropriate unit of measurement for this item.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={form.unit} onValueChange={handleUnitChange}>
                <SelectTrigger className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist">
                  <SelectValue placeholder="Select unit..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedUnits).map(([category, units]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="unitCost"
                  className="text-sm font-medium text-gray-900 font-geist"
                >
                  Unit Cost (₱)
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Enter the cost per unit of this item.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="unitCost"
                type="number"
                name="unitCost"
                value={form.unitCost}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="totalCost"
                  className="text-sm font-medium text-gray-900 font-geist"
                >
                  Total Cost (₱)
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Enter the total cost for this item (Quantity × Unit Cost).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="totalCost"
                type="number"
                name="totalCost"
                value={form.totalCost}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
              />
              <p className="text-xs text-gray-600 font-geist">
                Calculated: Quantity × Unit Cost
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      Set the minimum quantity at which you should reorder this
                      item.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="reorderPoint"
                type="number"
                name="reorderPoint"
                value={form.reorderPoint}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="location"
                  className="text-sm font-medium text-gray-900 font-geist"
                >
                  Location
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Enter the storage location for this item (optional).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g., Shelf A1, Warehouse B"
                className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="supplier"
                  className="text-sm font-medium text-gray-900 font-geist"
                >
                  Supplier
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Select the supplier for this item (optional).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={
                  suppliers.find((s) => s.companyName === form.supplier)
                    ?.supplier_id || ""
                }
                onValueChange={handleSupplierChange}
              >
                <SelectTrigger className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist">
                  <SelectValue
                    placeholder={
                      loadingSuppliers
                        ? "Loading suppliers..."
                        : "Select supplier..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem
                      key={supplier.supplier_id}
                      value={supplier.supplier_id}
                    >
                      {supplier.companyName}
                    </SelectItem>
                  ))}
                  {suppliers.length === 0 && !loadingSuppliers && (
                    <SelectItem value="none" disabled>
                      No suppliers found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-900 font-geist"
              >
                Description
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Add any additional details about this item (optional).
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter item description, specifications, or notes..."
              className="min-h-[100px] py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
            />
          </div>
        </div>
      </ProjectModalLayout>
    </TooltipProvider>
  );
}
