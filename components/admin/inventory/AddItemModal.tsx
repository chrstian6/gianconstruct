// components/admin/inventory/AddItemModal.tsx
"use client";

import { useState, useEffect } from "react";
import { ProjectModalLayout } from "@/components/admin/projects/ProjectModalLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useModalStore } from "@/lib/stores";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSuppliers } from "@/action/supplier";
import { ISupplier } from "@/types/supplier";
import {
  getCategories,
  createInventory,
  createBatchInventory,
} from "@/action/inventory";
import { toast } from "sonner";
import { SingleItemForm } from "@/components/admin/inventory/SingleItemForm";
import { BatchItemForm } from "@/components/admin/inventory/BatchItemForm";
import { PDCModal } from "@/components/admin/inventory/PDCModal";

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

export interface ItemForm {
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

export interface BatchForm {
  supplier: string;
  location: string;
  items: (ItemForm & { isOpen: boolean })[];
}

export interface PDCData {
  checkDate: Date | undefined;
  totalAmount: number;
  supplier: string;
  itemCount: number;
  payee: string;
  amountInWords: string;
}

export function AddItemModal({ onAdd, onBatchAdd }: AddItemModalProps) {
  const { isCreateProjectOpen, setIsCreateProjectOpen } = useModalStore();
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [batchMode, setBatchMode] = useState(false);
  const [showPDCModal, setShowPDCModal] = useState(false);
  const [pdcData, setPdcData] = useState<PDCData>({
    checkDate: undefined,
    totalAmount: 0,
    supplier: "",
    itemCount: 0,
    payee: "EDNA B. SEGUIRO", // Hardcoded payee
    amountInWords: "",
  });
  const [createdItems, setCreatedItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPDCBeenCreated, setHasPDCBeenCreated] = useState(false);
  const [toastShown, setToastShown] = useState(false); // Prevent duplicate toasts

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

  // Batch state
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
        isOpen: false,
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
  }, [isCreateProjectOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isCreateProjectOpen && !showPDCModal) {
      resetForms();
    }
  }, [isCreateProjectOpen, showPDCModal]);

  // Calculate totals for single item
  const calculatedSingleTotalCapital =
    singleItem.quantity * singleItem.unitCost;

  // Calculate batch totals
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

  // Calculate total capital for PDC
  const totalCapital = batchMode
    ? batchTotals.totalCapital
    : calculatedSingleTotalCapital;
  const validBatchItemsCount = batchForm.items.filter(
    (item) => item.name && item.category && item.unit && item.unitCost > 0
  ).length;
  const itemCount = batchMode
    ? validBatchItemsCount
    : singleItem.name &&
        singleItem.category &&
        singleItem.unit &&
        singleItem.unitCost > 0
      ? 1
      : 0;
  const selectedSupplier = batchMode ? batchForm.supplier : singleItem.supplier;

  // Convert number to words for cheque amount
  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero Pesos Only";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const scales = ["", "Thousand", "Million", "Billion"];

    function convertHundreds(n: number): string {
      if (n === 0) return "";

      let words = "";

      if (n >= 100) {
        words += ones[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }

      if (n >= 20) {
        words += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      }

      if (n > 0) {
        words += ones[n] + " ";
      }

      return words.trim();
    }

    let words = "";
    let scaleIndex = 0;
    let number = Math.floor(num);

    if (number === 0) {
      words = "Zero";
    } else {
      while (number > 0) {
        const chunk = number % 1000;
        if (chunk !== 0) {
          const chunkWords = convertHundreds(chunk);
          words =
            chunkWords +
            (scales[scaleIndex] ? " " + scales[scaleIndex] + " " : "") +
            words;
        }
        number = Math.floor(number / 1000);
        scaleIndex++;
      }
    }

    words = words.trim() + " Pesos";

    const centavos = Math.round((num - Math.floor(num)) * 100);
    if (centavos > 0) {
      let centavoWords = "";
      if (centavos >= 20) {
        centavoWords += tens[Math.floor(centavos / 10)];
        if (centavos % 10 > 0) {
          centavoWords += " " + ones[centavos % 10];
        }
      } else if (centavos > 0) {
        centavoWords = ones[centavos];
      }
      words += " and " + centavoWords + " Centavos";
    }

    return words + " Only";
  };

  // Prepare items data for submission
  const prepareItemsData = () => {
    if (batchMode) {
      const validItems = batchForm.items.filter(
        (item) => item.name && item.category && item.unit && item.unitCost > 0
      );

      if (validItems.length === 0) {
        throw new Error("Please add at least one valid item");
      }

      return validItems.map((item) => ({
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
    } else {
      return [
        {
          ...singleItem,
          description: singleItem.description || undefined,
          supplier:
            singleItem.supplier === "none" ? undefined : singleItem.supplier,
          location: singleItem.location || undefined,
          salePrice: singleItem.salePrice || undefined,
        },
      ];
    }
  };

  // Create items and get their actual product IDs
  const createItemsAndGetIds = async (itemsData: any[]) => {
    setIsProcessing(true);
    try {
      let createdItemsWithIds = [];

      if (batchMode) {
        const result = await createBatchInventory(itemsData);
        if (result.success && result.items) {
          createdItemsWithIds = result.items;
        } else {
          throw new Error(result.error || "Failed to create batch items");
        }
      } else {
        const result = await createInventory(itemsData[0]);
        if (result.success && result.item) {
          createdItemsWithIds = [result.item];
        } else {
          throw new Error(result.error || "Failed to create item");
        }
      }

      return createdItemsWithIds;
    } catch (error) {
      console.error("Failed to create items:", error);
      toast.error("Failed to create items");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Show single toast (prevent duplicates)
  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    if (!toastShown) {
      setToastShown(true);
      if (type === "success") {
        toast.success(message);
      } else {
        toast.error(message);
      }

      // Reset toast flag after a short delay
      setTimeout(() => setToastShown(false), 1000);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const itemsData = prepareItemsData();

      if (totalCapital > 0 && selectedSupplier && selectedSupplier !== "none") {
        // PDC Flow: Create items first, then show PDC modal
        const createdItems = await createItemsAndGetIds(itemsData);
        setCreatedItems(createdItems);

        // Close the main modal first
        setIsCreateProjectOpen(false);

        // Then show PDC modal
        setPdcData({
          checkDate: undefined,
          totalAmount: totalCapital,
          supplier: selectedSupplier,
          itemCount: createdItems.length,
          payee: "EDNA B. SEGUIRO", // Hardcoded payee
          amountInWords: numberToWords(totalCapital),
        });
        setShowPDCModal(true);
        setHasPDCBeenCreated(false);
      } else {
        // Non-PDC Flow: Create items and notify parent
        await createItemsAndGetIds(itemsData);

        // Notify parent to refresh inventory
        if (batchMode) {
          if (onBatchAdd) {
            onBatchAdd(itemsData);
          }
        } else {
          onAdd(itemsData[0]);
        }

        // Close modal and reset
        setIsCreateProjectOpen(false);
        resetForms();
        showToast(
          batchMode
            ? `Successfully added ${itemsData.length} items`
            : "Item added successfully"
        );
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  // Handle PDC confirmation - This is called AFTER PDC is created in PDCModal
  const handlePDCConfirm = () => {
    // Prevent duplicate execution
    if (hasPDCBeenCreated) {
      return;
    }

    // Prepare items data for parent callback
    const itemsData = prepareItemsData();

    // Notify parent to refresh inventory
    if (batchMode) {
      if (onBatchAdd) {
        onBatchAdd(itemsData);
      }
    } else {
      onAdd(itemsData[0]);
    }

    // Mark PDC as created and reset
    setHasPDCBeenCreated(true);
    setShowPDCModal(false);
    resetForms();
    showToast("PDC recorded successfully");
  };

  // Handle PDC cancellation
  const handlePDCCancel = () => {
    // Prepare items data for parent callback
    const itemsData = prepareItemsData();

    // Notify parent to refresh inventory (items were already created)
    if (batchMode) {
      if (onBatchAdd) {
        onBatchAdd(itemsData);
      }
    } else {
      onAdd(itemsData[0]);
    }

    // Close PDC modal and reset
    setShowPDCModal(false);
    resetForms();
    showToast("Items added successfully");
  };

  // Reset all forms
  const resetForms = () => {
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
    setBatchMode(false);
    setCreatedItems([]);
    setHasPDCBeenCreated(false);
    setToastShown(false);
    setShowPDCModal(false);
  };

  const handleCancel = () => {
    setIsCreateProjectOpen(false);
    resetForms();
  };

  const isSingleFormValid =
    singleItem.name &&
    singleItem.category &&
    singleItem.unit &&
    singleItem.unitCost > 0;

  const isBatchFormValid =
    batchForm.supplier &&
    batchForm.supplier !== "none" &&
    validBatchItemsCount > 0;

  // Get inventory items for PDC display
  const getInventoryItemsForPDC = () => {
    return createdItems.map((item) => ({
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      unitCost: item.unitCost,
      unit: item.unit,
      category: item.category,
    }));
  };

  // Get items list for display in PDC modal
  const getItemsListForDisplay = () => {
    return createdItems.map((item) => item.name);
  };

  return (
    <TooltipProvider>
      <ProjectModalLayout
        open={isCreateProjectOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          } else {
            setIsCreateProjectOpen(true);
          }
        }}
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
                  disabled={
                    batchMode
                      ? !isBatchFormValid
                      : !isSingleFormValid || isProcessing
                  }
                  className="min-w-[120px] bg-gray-900 hover:bg-gray-800 text-white rounded-full font-geist disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing
                    ? "Creating..."
                    : batchMode
                      ? `Add ${validBatchItemsCount} Item${validBatchItemsCount !== 1 ? "s" : ""}`
                      : "Add to Inventory"}
                </Button>
              </div>
            </div>
          </>
        }
      >
        <div className="space-y-6">
          {batchMode ? (
            <BatchItemForm
              batchForm={batchForm}
              setBatchForm={setBatchForm}
              suppliers={suppliers}
              categories={categories}
              loadingSuppliers={loadingSuppliers}
              loadingCategories={loadingCategories}
              batchTotals={batchTotals}
              validBatchItemsCount={validBatchItemsCount}
            />
          ) : (
            <SingleItemForm
              singleItem={singleItem}
              setSingleItem={setSingleItem}
              suppliers={suppliers}
              categories={categories}
              loadingSuppliers={loadingSuppliers}
              loadingCategories={loadingCategories}
              calculatedSingleTotalCapital={calculatedSingleTotalCapital}
            />
          )}

          {/* Required Fields Note */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 font-geist">
              <span className="font-medium">Note:</span> Fields marked with *
              are required.
              {batchMode &&
                " In batch mode, you must select a supplier and each item must have a name, category, unit, and base price."}
            </p>
            {totalCapital > 0 &&
              selectedSupplier &&
              selectedSupplier !== "none" && (
                <p className="text-xs text-blue-600 mt-1 font-geist">
                  ✓ Items will be created first, then you'll be prompted to
                  create a PDC record.
                </p>
              )}
          </div>
        </div>
      </ProjectModalLayout>

      {/* PDC Modal */}
      <PDCModal
        showPDCModal={showPDCModal}
        pdcData={pdcData}
        setPdcData={setPdcData}
        onConfirm={handlePDCConfirm}
        onCancel={handlePDCCancel}
        itemsList={getItemsListForDisplay()}
        inventoryItems={getInventoryItemsForPDC()}
        batchMode={batchMode}
      />
    </TooltipProvider>
  );
}
