// components/admin/inventory/AddItemModal.tsx
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
import { ISupplier } from "@/types/supplier";
import { getCategories } from "@/action/inventory"; // Assuming you have this action

interface AddItemModalProps {
  onAdd: (item: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
    description?: string;
    supplier?: string;
    reorderPoint: number;
    safetyStock: number;
    location?: string;
    unitCost: number;
  }) => void;
}

// Construction-specific units of measurement
const CONSTRUCTION_UNITS = [
  // Weight Units
  { value: "kg", label: "Kilograms (kg)", category: "Weight" },
  { value: "g", label: "Grams (g)", category: "Weight" },
  { value: "tons", label: "Metric Tons", category: "Weight" },
  { value: "lbs", label: "Pounds (lbs)", category: "Weight" },

  // Volume Units
  { value: "m³", label: "Cubic Meters (m³)", category: "Volume" },
  { value: "cm³", label: "Cubic Centimeters (cm³)", category: "Volume" },
  { value: "L", label: "Liters (L)", category: "Volume" },
  { value: "mL", label: "Milliliters (mL)", category: "Volume" },
  { value: "gal", label: "Gallons (gal)", category: "Volume" },
  { value: "bags", label: "Bags", category: "Volume" },
  { value: "drums", label: "Drums", category: "Volume" },

  // Length/Distance Units
  { value: "m", label: "Meters (m)", category: "Length" },
  { value: "cm", label: "Centimeters (cm)", category: "Length" },
  { value: "mm", label: "Millimeters (mm)", category: "Length" },
  { value: "km", label: "Kilometers (km)", category: "Length" },
  { value: "ft", label: "Feet (ft)", category: "Length" },
  { value: "in", label: "Inches (in)", category: "Length" },
  { value: "yd", label: "Yards (yd)", category: "Length" },

  // Area Units
  { value: "m²", label: "Square Meters (m²)", category: "Area" },
  { value: "cm²", label: "Square Centimeters (cm²)", category: "Area" },
  { value: "mm²", label: "Square Millimeters (mm²)", category: "Area" },
  { value: "ft²", label: "Square Feet (ft²)", category: "Area" },
  { value: "in²", label: "Square Inches (in²)", category: "Area" },
  { value: "yd²", label: "Square Yards (yd²)", category: "Area" },
  { value: "hectares", label: "Hectares", category: "Area" },
  { value: "acres", label: "Acres", category: "Area" },

  // Countable Units
  { value: "pcs", label: "Pieces (pcs)", category: "Count" },
  { value: "units", label: "Units", category: "Count" },
  { value: "packs", label: "Packs", category: "Count" },
  { value: "bundles", label: "Bundles", category: "Count" },
  { value: "rolls", label: "Rolls", category: "Count" },
  { value: "sheets", label: "Sheets", category: "Count" },
  { value: "panels", label: "Panels", category: "Count" },
  { value: "blocks", label: "Blocks", category: "Count" },
  { value: "tiles", label: "Tiles", category: "Count" },

  // Time Units
  { value: "hours", label: "Hours", category: "Time" },
  { value: "days", label: "Days", category: "Time" },
  { value: "weeks", label: "Weeks", category: "Time" },
  { value: "months", label: "Months", category: "Time" },

  // Special Construction Units
  { value: "set", label: "Set", category: "Special" },
  { value: "kit", label: "Kit", category: "Special" },
  { value: "pair", label: "Pair", category: "Special" },
  { value: "lot", label: "Lot", category: "Special" },
  { value: "pallet", label: "Pallet", category: "Special" },
  { value: "skid", label: "Skid", category: "Special" },
];

export function AddItemModal({ onAdd }: AddItemModalProps) {
  const { isCreateProjectOpen, setIsCreateProjectOpen } = useModalStore();
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: 0,
    unit: "",
    description: "",
    supplier: "",
    reorderPoint: 0,
    safetyStock: 0,
    location: "",
    unitCost: 0,
  });

  // Fetch suppliers and categories when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (isCreateProjectOpen) {
        try {
          setLoadingSuppliers(true);
          setLoadingCategories(true);

          // Fetch suppliers
          const supplierData = await getSuppliers();
          const activeSuppliers = supplierData.filter(
            (supplier) => supplier.status === "active"
          );
          setSuppliers(activeSuppliers);

          // Fetch categories
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
  }, [isCreateProjectOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "quantity" ||
        name === "reorderPoint" ||
        name === "safetyStock" ||
        name === "unitCost"
          ? Number(value)
          : value,
    }));
  };

  const handleUnitChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      unit: value,
    }));
  };

  const handleSupplierChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      supplier: value,
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
    setForm((prev) => ({ ...prev, category: "" }));
  };

  const handleSubmit = () => {
    // Filter out empty optional fields
    const itemData = {
      ...form,
      description: form.description || undefined,
      supplier: form.supplier || undefined,
      location: form.location || undefined,
    };

    onAdd(itemData);
    // Reset form after submission
    setForm({
      name: "",
      category: "",
      quantity: 0,
      unit: "",
      description: "",
      supplier: "",
      reorderPoint: 0,
      safetyStock: 0,
      location: "",
      unitCost: 0,
    });
    setShowCustomCategory(false);
    setCustomCategory("");
  };

  const handleCancel = () => {
    // Reset form on cancel
    setForm({
      name: "",
      category: "",
      quantity: 0,
      unit: "",
      description: "",
      supplier: "",
      reorderPoint: 0,
      safetyStock: 0,
      location: "",
      unitCost: 0,
    });
    setShowCustomCategory(false);
    setCustomCategory("");
    setIsCreateProjectOpen(false);
  };

  const calculatedTotalCost = form.quantity * form.unitCost;

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
    <TooltipProvider>
      <ProjectModalLayout
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        title="Add New Inventory Item"
        description="Complete the form below to add a new item to your inventory. All fields with detailed descriptions to help you provide accurate information."
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
              Add to Inventory
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Name and Category */}
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
                      Enter the starting quantity of this item in your
                      inventory. Use 0 if adding for future use.
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
              <p className="text-xs text-gray-600 font-geist">
                Current stock level for this item
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
                      construction item.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={form.unit} onValueChange={handleUnitChange}>
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
                Item Description
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Add detailed specifications, quality notes, or any special
                    characteristics of this item.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
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
                    Select the main supplier for this item from your active
                    suppliers list.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={form.supplier} onValueChange={handleSupplierChange}>
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
                <SelectItem value="string">None (No supplier)</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem
                    key={supplier.supplier_id}
                    value={supplier.companyName}
                  >
                    {supplier.companyName}
                  </SelectItem>
                ))}
                {suppliers.length === 0 && !loadingSuppliers && (
                  <SelectItem value="" disabled>
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

          {/* Reorder Point, Safety Stock and Unit Cost */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      Set the minimum quantity that triggers a reorder alert.
                      Helps prevent stockouts.
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
              <p className="text-xs text-gray-600 font-geist">
                Alert when stock falls below this level
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="safetyStock"
                  className="text-sm font-medium text-gray-900 font-geist"
                >
                  Safety Stock
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Set the minimum buffer stock to handle unexpected demand
                      or supply delays.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="safetyStock"
                type="number"
                name="safetyStock"
                value={form.safetyStock}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
              />
              <p className="text-xs text-gray-600 font-geist">
                Buffer stock for unexpected demand
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="unitCost"
                  className="text-sm font-medium text-gray-900 font-geist"
                >
                  Unit Cost
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Enter the cost per unit. This is used for inventory
                      valuation and cost tracking.
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
                  value={form.unitCost}
                  onChange={handleChange}
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
                    Specify where this item is stored (shelf, bin, room, or
                    warehouse location).
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Optional: Shelf A5, Bin 12, Warehouse North"
              className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
            />
            <p className="text-xs text-gray-600 font-geist">
              Example: Shelf A5, Bin 12, Warehouse North
            </p>
          </div>

          {/* Summary Card */}
          {(form.quantity > 0 || form.unitCost > 0) && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium mb-3 text-blue-900 font-geist flex items-center gap-2">
                <Info className="h-4 w-4" />
                Inventory Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {form.quantity > 0 && (
                  <div>
                    <span className="text-blue-700 font-geist">
                      Initial Stock:
                    </span>
                    <p className="font-medium text-blue-900 font-geist">
                      {form.quantity.toLocaleString()} {form.unit || "units"}
                    </p>
                  </div>
                )}
                {form.unitCost > 0 && (
                  <div>
                    <span className="text-blue-700 font-geist">Unit Cost:</span>
                    <p className="font-medium text-blue-900 font-geist">
                      ₱
                      {form.unitCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
                {form.quantity > 0 && form.unitCost > 0 && (
                  <div>
                    <span className="text-blue-700 font-geist">
                      Total Inventory Value:
                    </span>
                    <p className="font-medium text-blue-900 font-geist">
                      ₱
                      {calculatedTotalCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
                {form.reorderPoint > 0 && (
                  <div>
                    <span className="text-blue-700 font-geist">
                      Reorder Alert:
                    </span>
                    <p className="font-medium text-blue-900 font-geist">
                      When stock drops below {form.reorderPoint}{" "}
                      {form.unit || "units"}
                    </p>
                  </div>
                )}
                {form.safetyStock > 0 && (
                  <div>
                    <span className="text-blue-700 font-geist">
                      Safety Stock:
                    </span>
                    <p className="font-medium text-blue-900 font-geist">
                      {form.safetyStock.toLocaleString()} {form.unit || "units"}
                    </p>
                  </div>
                )}
                {form.supplier && (
                  <div>
                    <span className="text-blue-700 font-geist">
                      Selected Supplier:
                    </span>
                    <p className="font-medium text-blue-900 font-geist">
                      {form.supplier}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Required Fields Note */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 font-geist">
              <span className="font-medium">Note:</span> Fields marked with
              detailed descriptions are required for proper inventory
              management. All other fields are optional but recommended for
              better organization.
            </p>
          </div>
        </div>
      </ProjectModalLayout>
    </TooltipProvider>
  );
}
