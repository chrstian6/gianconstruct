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
import {
  Info,
  Plus,
  X,
  Trash2,
  Copy,
  Users,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { getSuppliers } from "@/action/supplier";
import { ISupplier } from "@/types/supplier";
import { getCategories } from "@/action/inventory";
import { createBatchInventory } from "@/action/inventory";
import { toast } from "sonner";

interface AddItemModalProps {
  onAdd: (item: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
    description?: string;
    supplier?: string;
    reorderPoint: number;
    location?: string;
    unitCost: number;
    salePrice?: number;
  }) => void;
  onBatchAdd?: (
    items: {
      name: string;
      category: string;
      quantity: number;
      unit: string;
      description?: string;
      supplier?: string;
      reorderPoint: number;
      location?: string;
      unitCost: number;
      salePrice?: number;
    }[]
  ) => void;
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

interface ItemForm {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  description: string;
  reorderPoint: number;
  location: string;
  unitCost: number;
  salePrice: number;
}

interface BatchForm {
  supplier: string;
  location: string;
  items: (ItemForm & { isOpen: boolean })[];
}

export function AddItemModal({ onAdd, onBatchAdd }: AddItemModalProps) {
  const { isCreateProjectOpen, setIsCreateProjectOpen } = useModalStore();
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [batchMode, setBatchMode] = useState(false);

  // Single item state
  const [singleItem, setSingleItem] = useState<ItemForm & { supplier: string }>(
    {
      name: "",
      category: "",
      quantity: 0,
      unit: "",
      description: "",
      supplier: "none",
      reorderPoint: 0,
      location: "",
      unitCost: 0,
      salePrice: 0,
    }
  );

  // Batch state - NEW DESIGN: Single supplier for all items
  const [batchForm, setBatchForm] = useState<BatchForm>({
    supplier: "none",
    location: "",
    items: [
      {
        name: "",
        category: "",
        quantity: 0,
        unit: "",
        description: "",
        reorderPoint: 0,
        location: "",
        unitCost: 0,
        salePrice: 0,
        isOpen: false, // First item starts closed
      },
    ],
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

  // Single item handlers
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

  // Batch form handlers - NEW DESIGN
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
          location: prev.location || "", // Use batch location
          unitCost: 0,
          salePrice: 0,
          isOpen: true, // New items start open
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
          isOpen: true, // Duplicated items start open
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
    if (batchMode) {
      // Apply to all batch items
      setBatchForm((prev) => ({
        ...prev,
        items: prev.items.map((item) => ({ ...item, category: value })),
      }));
    } else {
      setSingleItem((prev) => ({ ...prev, category: value }));
    }
  };

  const handleCancelCustomCategory = () => {
    setShowCustomCategory(false);
    setCustomCategory("");
    if (batchMode) {
      setBatchForm((prev) => ({
        ...prev,
        items: prev.items.map((item) => ({ ...item, category: "" })),
      }));
    } else {
      setSingleItem((prev) => ({ ...prev, category: "" }));
    }
  };

  const handleSingleSubmit = () => {
    // Filter out empty optional fields and convert "none" to undefined
    const itemData = {
      ...singleItem,
      description: singleItem.description || undefined,
      supplier:
        singleItem.supplier === "none" ? undefined : singleItem.supplier,
      location: singleItem.location || undefined,
      salePrice: singleItem.salePrice || undefined,
    };

    onAdd(itemData);
    // Reset form after submission
    setSingleItem({
      name: "",
      category: "",
      quantity: 0,
      unit: "",
      description: "",
      supplier: "none",
      reorderPoint: 0,
      location: "",
      unitCost: 0,
      salePrice: 0,
    });
    setShowCustomCategory(false);
    setCustomCategory("");
  };

  const handleBatchSubmit = async () => {
    try {
      const validItems = batchForm.items.filter(
        (item) => item.name && item.category && item.unit && item.unitCost > 0
      );

      if (validItems.length === 0) {
        toast.error("Please add at least one valid item");
        return;
      }

      if (!batchForm.supplier || batchForm.supplier === "none") {
        toast.error("Please select a supplier for the batch");
        return;
      }

      // Prepare items with batch-level supplier and location
      const itemsToSubmit = validItems.map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        description: item.description || undefined,
        supplier:
          batchForm.supplier === "none" ? undefined : batchForm.supplier,
        reorderPoint: item.reorderPoint,
        location: item.location || batchForm.location || undefined,
        unitCost: item.unitCost,
        salePrice: item.salePrice || undefined,
      }));

      console.log("Submitting batch items:", itemsToSubmit); // Debug log

      // Use onBatchAdd if provided, otherwise use the API directly
      if (onBatchAdd) {
        onBatchAdd(itemsToSubmit);
      } else {
        const result = await createBatchInventory(itemsToSubmit);

        if (result.success) {
          toast.success(
            `Successfully added ${result.count} items from ${suppliers.find((s) => s.companyName === batchForm.supplier)?.companyName || "the supplier"}`
          );
          setIsCreateProjectOpen(false);
          // Reset batch form
          setBatchForm({
            supplier: "none",
            location: "",
            items: [
              {
                name: "",
                category: "",
                quantity: 0,
                unit: "",
                description: "",
                reorderPoint: 0,
                location: "",
                unitCost: 0,
                salePrice: 0,
                isOpen: false,
              },
            ],
          });
        } else {
          toast.error(result.error || "Failed to add items");
        }
      }
    } catch (error) {
      toast.error("Failed to add items");
      console.error("Error creating batch items:", error);
    }
  };

  const handleSubmit = () => {
    if (batchMode) {
      handleBatchSubmit();
    } else {
      handleSingleSubmit();
    }
  };

  const handleCancel = () => {
    // Reset forms on cancel
    setSingleItem({
      name: "",
      category: "",
      quantity: 0,
      unit: "",
      description: "",
      supplier: "none",
      reorderPoint: 0,
      location: "",
      unitCost: 0,
      salePrice: 0,
    });
    setBatchForm({
      supplier: "none",
      location: "",
      items: [
        {
          name: "",
          category: "",
          quantity: 0,
          unit: "",
          description: "",
          reorderPoint: 0,
          location: "",
          unitCost: 0,
          salePrice: 0,
          isOpen: false,
        },
      ],
    });
    setShowCustomCategory(false);
    setCustomCategory("");
    setBatchMode(false);
    setIsCreateProjectOpen(false);
  };

  const isSingleFormValid =
    singleItem.name &&
    singleItem.category &&
    singleItem.unit &&
    singleItem.unitCost > 0;

  // FIXED: Count all valid items, not just some
  const validBatchItemsCount = batchForm.items.filter(
    (item) => item.name && item.category && item.unit && item.unitCost > 0
  ).length;

  const isBatchFormValid =
    batchForm.supplier &&
    batchForm.supplier !== "none" &&
    validBatchItemsCount > 0;

  // Calculate totals for single item
  const calculatedSingleTotalCapital =
    singleItem.quantity * singleItem.unitCost;
  const calculatedSingleTotalValue =
    singleItem.quantity * (singleItem.salePrice || 0);

  // Calculate batch totals - FIXED: Use valid items count
  const batchTotals = batchForm.items.reduce(
    (acc, item) => {
      const totalCapital = item.quantity * item.unitCost;
      const totalValue = item.quantity * (item.salePrice || 0);
      const isValidItem =
        item.name && item.category && item.unit && item.unitCost > 0;

      return {
        totalCapital: acc.totalCapital + totalCapital,
        totalValue: acc.totalValue + totalValue,
        itemCount: isValidItem ? acc.itemCount + 1 : acc.itemCount,
      };
    },
    { totalCapital: 0, totalValue: 0, itemCount: 0 }
  );

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

  const renderSingleItemForm = () => (
    <div className="space-y-6">
      {/* ... (single item form remains exactly the same as before) ... */}
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
                <X className="h-4 w-4" />
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
                  {calculatedSingleTotalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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

  const renderBatchItemForm = () => (
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
                {/* FIXED: Use validBatchItemsCount instead of batchTotals.itemCount */}
                <p className="font-medium">{validBatchItemsCount}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Capital:</span>
                <p className="font-medium">
                  ₱{batchTotals.totalCapital.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Total Value:</span>
                <p className="font-medium">
                  ₱{batchTotals.totalValue.toFixed(2)}
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

  return (
    <TooltipProvider>
      <ProjectModalLayout
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        title="Add Inventory Items"
        description={
          batchMode
            ? "Add multiple items from a single supplier. Perfect for bulk imports and efficient inventory management."
            : "Complete the form below to add a new item to your inventory."
        }
        footerActions={
          <>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="batchMode"
                  checked={batchMode}
                  onChange={(e) => setBatchMode(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="batchMode" className="text-sm font-geist">
                  Add multiple items from one supplier
                </Label>
              </div>

              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="min-w-[120px] border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full font-geist"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={batchMode ? !isBatchFormValid : !isSingleFormValid}
                  className="min-w-[120px] bg-gray-900 hover:bg-gray-800 text-white rounded-full font-geist disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {/* FIXED: Use validBatchItemsCount instead of batchTotals.itemCount */}
                  {batchMode
                    ? `Add ${validBatchItemsCount} Item${validBatchItemsCount !== 1 ? "s" : ""}`
                    : "Add to Inventory"}
                </Button>
              </div>
            </div>
          </>
        }
      >
        <div className="space-y-6">
          {batchMode ? renderBatchItemForm() : renderSingleItemForm()}

          {/* Required Fields Note */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 font-geist">
              <span className="font-medium">Note:</span> Fields marked with *
              are required.
              {batchMode &&
                " In batch mode, you must select a supplier and each item must have a name, category, unit, and base price."}
            </p>
          </div>
        </div>
      </ProjectModalLayout>
    </TooltipProvider>
  );
}
