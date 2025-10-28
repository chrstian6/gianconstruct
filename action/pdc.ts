// actions/pdc.ts
"use server";

import dbConnect from "@/lib/db";
import PDC, { IPDC } from "@/models/Pdc";
import Inventory, { IInventoryDoc } from "@/models/Inventory";
import {
  PDC as PDCType,
  PDCCreateData,
  PDCStatusUpdate,
  PDCSearchCriteria,
  PDCStats,
  PDCWithItems,
} from "@/types/pdc";

// Function to check and auto-issue PDCs based on check date
async function checkAndAutoIssuePDCs(): Promise<void> {
  try {
    await dbConnect();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison

    // Find pending PDCs where check date is today or in the past
    const pendingPDCs = await PDC.find({
      status: "pending",
      checkDate: { $lte: today },
    });

    for (const pdc of pendingPDCs) {
      console.log(
        `🔄 Auto-issuing PDC: ${pdc.checkNumber} with check date: ${pdc.checkDate}`
      );

      // Update status to issued
      pdc.status = "issued";
      pdc.issuedAt = new Date();
      pdc.updatedAt = new Date();

      await pdc.save();

      console.log(`✅ Auto-issued PDC: ${pdc.checkNumber}`);
    }

    if (pendingPDCs.length > 0) {
      console.log(`🎯 Auto-issued ${pendingPDCs.length} PDC(s)`);
    }
  } catch (error) {
    console.error("❌ Failed to auto-issue PDCs:", error);
  }
}

// Check for PDCs to auto-issue when server starts
checkAndAutoIssuePDCs();

// Set up interval to check for PDCs to auto-issue daily
if (typeof setInterval !== "undefined") {
  setInterval(checkAndAutoIssuePDCs, 24 * 60 * 60 * 1000); // Check every 24 hours
}

// action/pdc.ts - Check if there's any duplicate creation
export async function createPDC(
  pdcData: PDCCreateData
): Promise<{ success: boolean; pdc?: PDCType; error?: string }> {
  try {
    await dbConnect();

    // Generate check number if not provided
    const checkNumber =
      pdcData.checkNumber || `CBC-${Date.now().toString().slice(-8)}`;

    // Check if PDC with this check number already exists
    const existingPDC = await PDC.findOne({ checkNumber });
    if (existingPDC) {
      return { success: false, error: "Check number already exists" };
    }

    // Check if check date is today or in the past, auto-issue if so
    const checkDate = new Date(pdcData.checkDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    const shouldAutoIssue = checkDate <= today;
    const status = shouldAutoIssue ? "issued" : "pending";
    const issuedAt = shouldAutoIssue ? new Date() : undefined;

    const pdc = new PDC({
      ...pdcData,
      checkNumber,
      status,
      issuedAt,
    });

    await pdc.save();

    // Convert Mongoose document to PDCType with proper typing
    const pdcDoc = pdc.toObject() as any;

    const pdcResult: PDCType = {
      pdc_id: pdcDoc._id.toString(),
      checkNumber: pdcDoc.checkNumber,
      checkDate: pdcDoc.checkDate,
      supplier: pdcDoc.supplier,
      totalAmount: pdcDoc.totalAmount,
      itemCount: pdcDoc.itemCount,
      payee: pdcDoc.payee,
      amountInWords: pdcDoc.amountInWords,
      items: pdcDoc.items,
      status: pdcDoc.status,
      notes: pdcDoc.notes,
      createdAt: pdcDoc.createdAt,
      updatedAt: pdcDoc.updatedAt,
      issuedAt: pdcDoc.issuedAt,
      cancelledAt: pdcDoc.cancelledAt,
    };

    console.log(
      `✅ PDC created successfully: ${pdcResult.checkNumber} with status: ${pdcResult.status}`
    ); // Add logging
    return {
      success: true,
      pdc: pdcResult,
    };
  } catch (error: any) {
    console.error("❌ Failed to create PDC:", error);

    if (error.code === 11000) {
      return { success: false, error: "Check number already exists" };
    }

    return { success: false, error: "Failed to create PDC record" };
  }
}

export async function getAllPDCs(): Promise<{
  success: boolean;
  pdcs?: PDCWithItems[];
  error?: string;
}> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const pdcs = await PDC.find().sort({ createdAt: -1 }).lean();

    // Get item details for all PDCs
    const pdcsWithItems: PDCWithItems[] = await Promise.all(
      pdcs.map(async (pdc: any) => {
        const itemDetails = await getPDCItemDetails(pdc.items);

        return {
          pdc_id: pdc._id.toString(),
          checkNumber: pdc.checkNumber,
          checkDate: pdc.checkDate,
          supplier: pdc.supplier,
          totalAmount: pdc.totalAmount,
          itemCount: pdc.itemCount,
          payee: pdc.payee,
          amountInWords: pdc.amountInWords,
          items: pdc.items,
          status: pdc.status,
          notes: pdc.notes,
          createdAt: pdc.createdAt,
          updatedAt: pdc.updatedAt,
          issuedAt: pdc.issuedAt,
          cancelledAt: pdc.cancelledAt,
          itemDetails,
        };
      })
    );

    return {
      success: true,
      pdcs: pdcsWithItems,
    };
  } catch (error) {
    console.error("Failed to fetch PDCs:", error);
    return { success: false, error: "Failed to fetch PDC records" };
  }
}

export async function getPDCById(
  pdc_id: string
): Promise<{ success: boolean; pdc?: PDCWithItems; error?: string }> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const pdc = await PDC.findById(pdc_id).lean();
    if (!pdc) {
      return { success: false, error: "PDC not found" };
    }

    // Get item details from inventory
    const itemDetails = await getPDCItemDetails(pdc.items);

    const pdcResult: PDCWithItems = {
      pdc_id: pdc._id.toString(),
      checkNumber: pdc.checkNumber,
      checkDate: pdc.checkDate,
      supplier: pdc.supplier,
      totalAmount: pdc.totalAmount,
      itemCount: pdc.itemCount,
      payee: pdc.payee,
      amountInWords: pdc.amountInWords,
      items: pdc.items,
      status: pdc.status,
      notes: pdc.notes,
      createdAt: pdc.createdAt,
      updatedAt: pdc.updatedAt,
      issuedAt: pdc.issuedAt,
      cancelledAt: pdc.cancelledAt,
      itemDetails,
    };

    return {
      success: true,
      pdc: pdcResult,
    };
  } catch (error) {
    console.error("Failed to fetch PDC:", error);
    return { success: false, error: "Failed to fetch PDC record" };
  }
}

export async function getPDCsByStatus(
  status: "pending" | "issued" | "cancelled"
): Promise<{ success: boolean; pdcs?: PDCWithItems[]; error?: string }> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    if (status === "pending") {
      await checkAndAutoIssuePDCs();
    }

    const pdcs = await PDC.find({ status })
      .sort({
        checkDate: -1,
        createdAt: -1,
      })
      .lean();

    // Get item details for all PDCs
    const pdcsWithItems: PDCWithItems[] = await Promise.all(
      pdcs.map(async (pdc: any) => {
        const itemDetails = await getPDCItemDetails(pdc.items);

        return {
          pdc_id: pdc._id.toString(),
          checkNumber: pdc.checkNumber,
          checkDate: pdc.checkDate,
          supplier: pdc.supplier,
          totalAmount: pdc.totalAmount,
          itemCount: pdc.itemCount,
          payee: pdc.payee,
          amountInWords: pdc.amountInWords,
          items: pdc.items,
          status: pdc.status,
          notes: pdc.notes,
          createdAt: pdc.createdAt,
          updatedAt: pdc.updatedAt,
          issuedAt: pdc.issuedAt,
          cancelledAt: pdc.cancelledAt,
          itemDetails,
        };
      })
    );

    return {
      success: true,
      pdcs: pdcsWithItems,
    };
  } catch (error) {
    console.error("Failed to fetch PDCs by status:", error);
    return { success: false, error: "Failed to fetch PDC records" };
  }
}

export async function updatePDCStatus(
  pdc_id: string,
  statusUpdate: PDCStatusUpdate
): Promise<{ success: boolean; pdc?: PDCType; error?: string }> {
  try {
    await dbConnect();

    const updateData: any = {
      status: statusUpdate.status,
      updatedAt: new Date(),
    };

    if (statusUpdate.status === "issued") {
      updateData.issuedAt = statusUpdate.issuedAt || new Date();
    } else if (statusUpdate.status === "cancelled") {
      updateData.cancelledAt = statusUpdate.cancelledAt || new Date();
    }

    const pdc = await PDC.findByIdAndUpdate(pdc_id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!pdc) {
      return { success: false, error: "PDC not found" };
    }

    const pdcResult: PDCType = {
      pdc_id: pdc._id.toString(),
      checkNumber: pdc.checkNumber,
      checkDate: pdc.checkDate,
      supplier: pdc.supplier,
      totalAmount: pdc.totalAmount,
      itemCount: pdc.itemCount,
      payee: pdc.payee,
      amountInWords: pdc.amountInWords,
      items: pdc.items,
      status: pdc.status,
      notes: pdc.notes,
      createdAt: pdc.createdAt,
      updatedAt: pdc.updatedAt,
      issuedAt: pdc.issuedAt,
      cancelledAt: pdc.cancelledAt,
    };

    return {
      success: true,
      pdc: pdcResult,
    };
  } catch (error) {
    console.error("Failed to update PDC status:", error);
    return { success: false, error: "Failed to update PDC status" };
  }
}

export async function getPDCsBySupplier(
  supplier: string
): Promise<{ success: boolean; pdcs?: PDCWithItems[]; error?: string }> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const pdcs = await PDC.find({ supplier })
      .sort({
        checkDate: -1,
        createdAt: -1,
      })
      .lean();

    // Get item details for all PDCs
    const pdcsWithItems: PDCWithItems[] = await Promise.all(
      pdcs.map(async (pdc: any) => {
        const itemDetails = await getPDCItemDetails(pdc.items);

        return {
          pdc_id: pdc._id.toString(),
          checkNumber: pdc.checkNumber,
          checkDate: pdc.checkDate,
          supplier: pdc.supplier,
          totalAmount: pdc.totalAmount,
          itemCount: pdc.itemCount,
          payee: pdc.payee,
          amountInWords: pdc.amountInWords,
          items: pdc.items,
          status: pdc.status,
          notes: pdc.notes,
          createdAt: pdc.createdAt,
          updatedAt: pdc.updatedAt,
          issuedAt: pdc.issuedAt,
          cancelledAt: pdc.cancelledAt,
          itemDetails,
        };
      })
    );

    return {
      success: true,
      pdcs: pdcsWithItems,
    };
  } catch (error) {
    console.error("Failed to fetch PDCs by supplier:", error);
    return { success: false, error: "Failed to fetch PDC records" };
  }
}

export async function getPDCsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; pdcs?: PDCWithItems[]; error?: string }> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const pdcs = await PDC.find({
      checkDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ checkDate: -1, createdAt: -1 })
      .lean();

    // Get item details for all PDCs
    const pdcsWithItems: PDCWithItems[] = await Promise.all(
      pdcs.map(async (pdc: any) => {
        const itemDetails = await getPDCItemDetails(pdc.items);

        return {
          pdc_id: pdc._id.toString(),
          checkNumber: pdc.checkNumber,
          checkDate: pdc.checkDate,
          supplier: pdc.supplier,
          totalAmount: pdc.totalAmount,
          itemCount: pdc.itemCount,
          payee: pdc.payee,
          amountInWords: pdc.amountInWords,
          items: pdc.items,
          status: pdc.status,
          notes: pdc.notes,
          createdAt: pdc.createdAt,
          updatedAt: pdc.updatedAt,
          issuedAt: pdc.issuedAt,
          cancelledAt: pdc.cancelledAt,
          itemDetails,
        };
      })
    );

    return {
      success: true,
      pdcs: pdcsWithItems,
    };
  } catch (error) {
    console.error("Failed to fetch PDCs by date range:", error);
    return { success: false, error: "Failed to fetch PDC records" };
  }
}

export async function getPDCStats(): Promise<{
  success: boolean;
  stats?: PDCStats;
  error?: string;
}> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const stats = await PDC.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const result: PDCStats = {
      total: 0,
      pending: 0,
      issued: 0,
      cancelled: 0,
      totalAmount: 0,
      pendingAmount: 0,
      issuedAmount: 0,
      cancelledAmount: 0,
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      result.totalAmount += stat.totalAmount;

      switch (stat._id) {
        case "pending":
          result.pending = stat.count;
          result.pendingAmount = stat.totalAmount;
          break;
        case "issued":
          result.issued = stat.count;
          result.issuedAmount = stat.totalAmount;
          break;
        case "cancelled":
          result.cancelled = stat.count;
          result.cancelledAmount = stat.totalAmount;
          break;
      }
    });

    return { success: true, stats: result };
  } catch (error) {
    console.error("Failed to fetch PDC stats:", error);
    return { success: false, error: "Failed to fetch PDC statistics" };
  }
}

export async function getPDCItems(
  pdc_id: string
): Promise<{ success: boolean; items?: any[]; error?: string }> {
  try {
    await dbConnect();

    const pdc = await PDC.findById(pdc_id).lean();
    if (!pdc) {
      return { success: false, error: "PDC not found" };
    }

    // Get full item details from inventory
    const itemDetails = await getPDCItemDetails(pdc.items);

    return {
      success: true,
      items: itemDetails,
    };
  } catch (error) {
    console.error("Failed to fetch PDC items:", error);
    return { success: false, error: "Failed to fetch PDC items" };
  }
}

export async function searchPDCs(criteria: PDCSearchCriteria): Promise<{
  success: boolean;
  pdcs?: PDCWithItems[];
  total?: number;
  error?: string;
}> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const {
      checkNumber,
      supplier,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = criteria;

    const query: any = {};

    if (checkNumber) {
      query.checkNumber = { $regex: checkNumber, $options: "i" };
    }

    if (supplier) {
      query.supplier = { $regex: supplier, $options: "i" };
    }

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.checkDate = {};
      if (dateFrom) query.checkDate.$gte = dateFrom;
      if (dateTo) query.checkDate.$lte = dateTo;
    }

    const skip = (page - 1) * limit;

    const [pdcs, total] = await Promise.all([
      PDC.find(query)
        .sort({ checkDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PDC.countDocuments(query),
    ]);

    // Get item details for all PDCs
    const pdcsWithItems: PDCWithItems[] = await Promise.all(
      pdcs.map(async (pdc: any) => {
        const itemDetails = await getPDCItemDetails(pdc.items);

        return {
          pdc_id: pdc._id.toString(),
          checkNumber: pdc.checkNumber,
          checkDate: pdc.checkDate,
          supplier: pdc.supplier,
          totalAmount: pdc.totalAmount,
          itemCount: pdc.itemCount,
          payee: pdc.payee,
          amountInWords: pdc.amountInWords,
          items: pdc.items,
          status: pdc.status,
          notes: pdc.notes,
          createdAt: pdc.createdAt,
          updatedAt: pdc.updatedAt,
          issuedAt: pdc.issuedAt,
          cancelledAt: pdc.cancelledAt,
          itemDetails,
        };
      })
    );

    return {
      success: true,
      pdcs: pdcsWithItems,
      total,
    };
  } catch (error) {
    console.error("Failed to search PDCs:", error);
    return { success: false, error: "Failed to search PDC records" };
  }
}

export async function deletePDC(
  pdc_id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();

    // Soft delete by updating status to cancelled
    const result = await PDC.findByIdAndUpdate(pdc_id, {
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    });

    if (!result) {
      return { success: false, error: "PDC not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete PDC:", error);
    return { success: false, error: "Failed to delete PDC record" };
  }
}

// Helper function to get item details from inventory
async function getPDCItemDetails(items: any[]): Promise<any[]> {
  try {
    await dbConnect();

    // Get all inventory items that match the PDC items
    const productIds = items.map((item) => item.product_id);

    // Filter out any temporary or invalid product IDs
    const validProductIds = productIds.filter(
      (id) => id && typeof id === "string" && !id.startsWith("temp-")
    );

    let inventoryItems: IInventoryDoc[] = [];

    if (validProductIds.length > 0) {
      inventoryItems = (await Inventory.find({
        product_id: { $in: validProductIds },
      }).lean()) as IInventoryDoc[];
    }

    if (!inventoryItems || inventoryItems.length === 0) {
      return items.map((item) => ({
        ...item,
        name: "Unknown Item",
        category: "Unknown Category",
        unit: "N/A",
        description: "",
        currentQuantity: 0,
        currentUnitCost: item.unitCost || 0,
        salePrice: 0,
        location: "",
        reorderPoint: 0,
      }));
    }

    // Map PDC items with their full details from inventory
    const itemDetails = items.map((pdcItem) => {
      const inventoryItem = inventoryItems.find(
        (invItem) => invItem.product_id === pdcItem.product_id
      );

      // Use virtual fields from Inventory model
      const totalCapital = inventoryItem
        ? (inventoryItem as any).totalCapital
        : 0;
      const totalValue = inventoryItem ? (inventoryItem as any).totalValue : 0;

      return {
        ...pdcItem,
        name: inventoryItem?.name || "Unknown Item",
        category: inventoryItem?.category || "Unknown Category",
        unit: inventoryItem?.unit || "N/A",
        description: inventoryItem?.description || "",
        currentQuantity: inventoryItem?.quantity || 0,
        currentUnitCost: inventoryItem?.unitCost || pdcItem.unitCost || 0,
        salePrice: inventoryItem?.salePrice || 0,
        location: inventoryItem?.location || "",
        reorderPoint: inventoryItem?.reorderPoint || 0,
        totalCapital,
        totalValue,
        timeCreated: inventoryItem?.timeCreated,
        timeUpdated: inventoryItem?.timeUpdated,
      };
    });

    return itemDetails;
  } catch (error) {
    console.error("Failed to get PDC item details:", error);
    // Return items with basic info on error
    return items.map((item) => ({
      ...item,
      name: "Unknown Item",
      category: "Unknown Category",
      unit: "N/A",
      description: "",
      currentQuantity: 0,
      currentUnitCost: item.unitCost || 0,
      salePrice: 0,
      location: "",
      reorderPoint: 0,
      totalCapital: 0,
      totalValue: 0,
    }));
  }
}

// Export the auto-issue function for manual triggering if needed
export { checkAndAutoIssuePDCs };
