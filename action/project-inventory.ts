// action/project-inventory.ts
"use server";

import dbConnect from "@/lib/db";
import ProjectInventory from "@/models/ProjectInventory";
import Inventory from "@/models/Inventory";
import { z } from "zod";
import {
  ProjectInventoryRecord,
  ProjectInventoryResponse,
  InventorySummaryResponse,
  CurrentInventoryItem,
} from "@/types/project-inventory";

// Validation schema - FIXED: Make projectReorderPoint properly optional
const projectInventorySchema = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  product_id: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(0, "Quantity cannot be negative"), // CHANGED: Allow 0 for setting reorder points
  unit: z.string().min(1, "Unit is required"),
  notes: z.string().optional(),
  action: z.enum(["checked_out", "returned", "adjusted"]),
  projectReorderPoint: z.number().min(0).optional().nullable(),
  action_by: z.object({
    user_id: z.string().min(1, "User ID is required"),
    name: z.string().min(1, "Name is required"),
    role: z.string().min(1, "Role is required"),
  }),
});

// Type for MongoDB document with proper typing
type ProjectInventoryDocument = {
  _id: any;
  projectInventory_id?: string;
  project_id?: string;
  product_id?: string;
  quantity?: number;
  unit?: string;
  supplier?: string;
  notes?: string;
  action?: string;
  salePrice?: number;
  unitCost?: number;
  totalValue?: number;
  totalCost?: number;
  projectReorderPoint?: number | null;
  action_by?: {
    user_id: string;
    name: string;
    role: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
};

// Helper function to convert MongoDB document to ProjectInventoryRecord - FIXED: Proper typing
function convertToProjectInventoryRecord(
  doc: ProjectInventoryDocument
): ProjectInventoryRecord {
  return {
    _id: doc._id?.toString() || "",
    projectInventory_id: doc.projectInventory_id || "",
    project_id: doc.project_id || "",
    product_id: doc.product_id || "",
    quantity: doc.quantity || 0,
    unit: doc.unit || "",
    supplier: doc.supplier || "Gian Construction",
    notes: doc.notes || "",
    action:
      (doc.action as "checked_out" | "returned" | "adjusted") || "checked_out",
    salePrice: doc.salePrice || 0,
    unitCost: doc.unitCost || 0,
    totalValue: doc.totalValue || 0,
    totalCost: doc.totalValue || 0,
    projectReorderPoint: doc.projectReorderPoint ?? undefined, // Convert null to undefined for type compatibility
    action_by: {
      user_id: doc.action_by?.user_id || "",
      name: doc.action_by?.name || "",
      role: doc.action_by?.role || "",
    },
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}

// Generate incremental projectInventory_id (unchanged)
async function generateProjectInventoryId(): Promise<string> {
  await dbConnect();

  const lastItem = await ProjectInventory.findOne(
    { projectInventory_id: { $regex: /^PI-\d+$/ } },
    { projectInventory_id: 1 },
    { sort: { projectInventory_id: -1 } }
  );

  let nextNumber = 1;

  if (lastItem && lastItem.projectInventory_id) {
    const lastNumber = parseInt(lastItem.projectInventory_id.split("-")[1]);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `PI-${nextNumber.toString().padStart(4, "0")}`;
}

// ========== NEW FUNCTION: Get all project inventory records across all projects ==========
export async function getAllProjectInventory(): Promise<ProjectInventoryResponse> {
  await dbConnect();

  try {
    console.log("📊 Fetching all project inventory transactions...");

    // Fetch all project inventory records across all projects
    const records = (await ProjectInventory.find({})
      .populate({
        path: "action_by",
        select: "name email role",
      })
      .populate({
        path: "project_id",
        select: "projectName projectNumber",
      })
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean()) as ProjectInventoryDocument[];

    console.log(`✅ Found ${records.length} total transactions`);

    // Transform the data to match the expected structure
    const convertedRecords = records.map((record) => {
      // Get project name from populated data or use placeholder
      let projectName = "Unknown Project";
      let project_id = record.project_id || "";

      // Check if project_id is populated
      if (record.project_id && typeof record.project_id === "object") {
        const projectData = record.project_id as any;
        projectName =
          projectData.projectName ||
          projectData.projectNumber ||
          "Unknown Project";
        project_id = projectData._id?.toString() || "";
      }

      // Get action_by details
      let action_by = {
        user_id: "",
        name: "Unknown User",
        role: "user",
      };

      if (record.action_by && typeof record.action_by === "object") {
        const userData = record.action_by as any;
        action_by = {
          user_id: userData._id?.toString() || "",
          name: userData.name || "Unknown User",
          role: userData.role || "user",
        };
      }

      return {
        _id: record._id?.toString() || "",
        projectInventory_id: record.projectInventory_id || "",
        project_id,
        projectName,
        product_id: record.product_id || "",
        action:
          (record.action as "checked_out" | "returned" | "adjusted") ||
          "checked_out",
        quantity: record.quantity || 0,
        unit: record.unit || "",
        supplier: record.supplier || "Gian Construction",
        notes: record.notes || "",
        salePrice: record.salePrice || 0,
        unitCost: record.unitCost || 0,
        totalValue: record.totalValue || 0,
        totalCost: record.totalValue || 0,
        projectReorderPoint: record.projectReorderPoint ?? undefined,
        action_by,
        createdAt: record.createdAt
          ? new Date(record.createdAt).toISOString()
          : new Date().toISOString(),
        updatedAt: record.updatedAt
          ? new Date(record.updatedAt).toISOString()
          : new Date().toISOString(),
      };
    });

    return {
      success: true,
      records: convertedRecords,
    };
  } catch (error: any) {
    console.error("❌ Error fetching all project inventory:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch all project inventory records",
    };
  }
}

// Create project inventory record - UPDATED: Properly handle projectReorderPoint with logging
export async function createProjectInventory(
  data: z.infer<typeof projectInventorySchema>
): Promise<ProjectInventoryResponse> {
  await dbConnect();

  try {
    // Log incoming data for debugging
    console.log("📥 createProjectInventory called with data:", {
      project_id: data.project_id,
      product_id: data.product_id,
      quantity: data.quantity,
      action: data.action,
      projectReorderPoint: data.projectReorderPoint,
      hasReorderPoint:
        data.projectReorderPoint !== undefined &&
        data.projectReorderPoint !== null,
      notes: data.notes?.substring(0, 50) || "none",
    });

    // Validate input
    const validatedData = projectInventorySchema.parse(data);

    // Get the inventory item details including sale price
    const inventoryItem = await Inventory.findOne({
      product_id: validatedData.product_id,
    });

    if (!inventoryItem) {
      console.log("❌ Inventory item not found:", validatedData.product_id);
      return {
        success: false,
        error: "Inventory item not found",
      };
    }

    const salePrice = inventoryItem.salePrice || 0;
    let totalValue = 0;

    // Skip quantity validation for quantity 0 (used for setting reorder points only)
    if (validatedData.quantity > 0) {
      // Handle each action type for non-zero quantities
      if (validatedData.action === "checked_out") {
        // Check if there's enough stock in main inventory
        if (inventoryItem.quantity < validatedData.quantity) {
          console.log("❌ Insufficient stock:", {
            requested: validatedData.quantity,
            available: inventoryItem.quantity,
            product_id: validatedData.product_id,
          });
          return {
            success: false,
            error: `Insufficient stock. Only ${inventoryItem.quantity} items available`,
          };
        }

        // Subtract from inventory stock
        inventoryItem.quantity -= validatedData.quantity;
        await inventoryItem.save();

        // Calculate total value for checkout
        totalValue = salePrice * validatedData.quantity;
        console.log("✅ Checkout successful:", {
          quantity: validatedData.quantity,
          salePrice,
          totalValue,
          newMainStock: inventoryItem.quantity,
        });
      } else if (validatedData.action === "returned") {
        // First, check if project has enough quantity to return
        const projectTransactions = await ProjectInventory.find({
          project_id: validatedData.project_id,
          product_id: validatedData.product_id,
        });

        // Calculate current quantity in project (excluding adjusted items)
        let projectCurrentQuantity = 0;

        projectTransactions.forEach((transaction: ProjectInventoryDocument) => {
          if (transaction.action === "checked_out") {
            projectCurrentQuantity += transaction.quantity || 0;
          } else if (transaction.action === "returned") {
            projectCurrentQuantity -= transaction.quantity || 0;
          }
          // Note: adjusted actions don't affect current quantity
        });

        if (projectCurrentQuantity < validatedData.quantity) {
          console.log("❌ Cannot return more than available in project:", {
            requested: validatedData.quantity,
            available: projectCurrentQuantity,
            product_id: validatedData.product_id,
          });
          return {
            success: false,
            error: `Cannot return more than available in project. Only ${projectCurrentQuantity} items available`,
          };
        }

        // Calculate total value for return
        totalValue = salePrice * validatedData.quantity;

        // Add back to main inventory
        inventoryItem.quantity += validatedData.quantity;
        await inventoryItem.save();
        console.log("✅ Return successful:", {
          quantity: validatedData.quantity,
          salePrice,
          totalValue,
          newMainStock: inventoryItem.quantity,
        });
      } else if (validatedData.action === "adjusted") {
        // For adjusted actions, check if total adjusted + requested <= total transferred in
        const projectTransactions = await ProjectInventory.find({
          project_id: validatedData.project_id,
          product_id: validatedData.product_id,
        });

        const totalAdjustedSoFar = projectTransactions
          .filter((t: ProjectInventoryDocument) => t.action === "adjusted")
          .reduce(
            (sum, t: ProjectInventoryDocument) => sum + (t.quantity || 0),
            0
          );

        const totalTransferredIn = projectTransactions
          .filter((t: ProjectInventoryDocument) => t.action === "checked_out")
          .reduce(
            (sum, t: ProjectInventoryDocument) => sum + (t.quantity || 0),
            0
          );

        // Check if adjusted + new adjustment <= transferred in
        if (totalAdjustedSoFar + validatedData.quantity > totalTransferredIn) {
          console.log("❌ Cannot adjust more than transferred to project:", {
            requested: validatedData.quantity,
            alreadyAdjusted: totalAdjustedSoFar,
            transferredIn: totalTransferredIn,
            maxAllowed: totalTransferredIn - totalAdjustedSoFar,
          });
          return {
            success: false,
            error: `Cannot adjust more than transferred to project. Only ${
              totalTransferredIn - totalAdjustedSoFar
            } items available for adjustment`,
          };
        }

        // For adjusted actions, totalValue should be 0
        // Adjusted items don't affect financial value
        totalValue = 0;
        console.log("✅ Adjustment recorded:", {
          quantity: validatedData.quantity,
          totalAdjustedSoFar: totalAdjustedSoFar + validatedData.quantity,
        });
      }
    } else if (validatedData.quantity === 0) {
      // Quantity 0 is only allowed for setting reorder points
      // Don't modify inventory stock or calculate total value
      console.log(
        "🔄 Creating record with quantity 0 to set reorder point only"
      );
      totalValue = 0;
    }

    // Generate unique ID
    const projectInventory_id = await generateProjectInventoryId();

    // Create new record with projectReorderPoint - FIXED: Always include if provided
    const newRecordData: any = {
      projectInventory_id,
      project_id: validatedData.project_id,
      product_id: validatedData.product_id,
      quantity: validatedData.quantity,
      unit: validatedData.unit,
      notes: validatedData.notes,
      action: validatedData.action,
      supplier: "Gian Construction",
      salePrice,
      totalValue,
      unitCost: 0,
      action_by: validatedData.action_by,
    };

    // CRITICAL FIX: Always include projectReorderPoint if provided
    if (validatedData.projectReorderPoint !== undefined) {
      newRecordData.projectReorderPoint = validatedData.projectReorderPoint;
      console.log(
        "🔧 Setting projectReorderPoint in record:",
        validatedData.projectReorderPoint
      );
    } else {
      // Even if null or undefined, explicitly set it to ensure consistency
      newRecordData.projectReorderPoint = validatedData.projectReorderPoint;
      console.log(
        "ℹ️ Setting projectReorderPoint to:",
        validatedData.projectReorderPoint
      );
    }

    const newRecord = new ProjectInventory(newRecordData);

    await newRecord.save();

    // Verify the saved record
    const savedDoc = (await ProjectInventory.findById(
      newRecord._id
    ).lean()) as ProjectInventoryDocument;
    console.log(
      "💾 Saved project inventory record:",
      JSON.stringify({
        projectInventory_id: savedDoc.projectInventory_id,
        product_id: savedDoc.product_id,
        quantity: savedDoc.quantity,
        action: savedDoc.action,
        projectReorderPoint: savedDoc.projectReorderPoint,
        totalValue: savedDoc.totalValue,
        notes: savedDoc.notes?.substring(0, 50) || "none",
        createdAt: savedDoc.createdAt,
      })
    );

    return {
      success: true,
      records: [convertToProjectInventoryRecord(savedDoc)],
    };
  } catch (error: any) {
    console.error("❌ Error creating project inventory:", error);

    if (error.name === "ZodError") {
      const errors = error.errors.map(
        (err: any) => `${err.path.join(".")}: ${err.message}`
      );
      console.error("❌ Validation errors:", errors);
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    return {
      success: false,
      error: error.message || "Failed to create inventory record",
    };
  }
}

// Get all inventory records for a project (FIXED: Added proper typing)
export async function getProjectInventory(
  project_id: string
): Promise<ProjectInventoryResponse> {
  await dbConnect();

  try {
    const records = (await ProjectInventory.find({ project_id })
      .sort({ createdAt: -1 })
      .lean()) as ProjectInventoryDocument[];

    const convertedRecords = records.map(convertToProjectInventoryRecord);

    return {
      success: true,
      records: convertedRecords,
    };
  } catch (error: any) {
    console.error("Error fetching project inventory:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch project inventory",
    };
  }
}

// Get recent actions (for activity log) (FIXED: Added proper typing)
export async function getRecentProjectActions(
  project_id: string,
  limit = 10
): Promise<ProjectInventoryResponse> {
  await dbConnect();

  try {
    const actions = (await ProjectInventory.find({ project_id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()) as ProjectInventoryDocument[];

    const convertedActions = actions.map(convertToProjectInventoryRecord);

    return {
      success: true,
      actions: convertedActions,
    };
  } catch (error: any) {
    console.error("Error fetching recent actions:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch recent actions",
    };
  }
}

// Get inventory summary for a project with financial data - FIXED: Type safety issues
export async function getProjectInventorySummary(
  project_id: string
): Promise<InventorySummaryResponse> {
  await dbConnect();

  try {
    const records = (await ProjectInventory.find({
      project_id,
    }).lean()) as ProjectInventoryDocument[];

    const summaryMap = new Map<
      string,
      {
        product_id: string;
        quantity: number;
        totalValue: number;
        totalCost: number;
        salePrice: number;
        unitCost: number;
        totalTransferredIn: number;
        totalReturnedOut: number;
        totalAdjustedOut: number;
        projectReorderPoint: number | undefined | null; // Track project reorder point
      }
    >();

    const inventoryItems = await Inventory.find({
      product_id: { $in: records.map((r) => r.product_id) },
    }).lean();

    const inventoryMap = new Map(
      inventoryItems.map((item: any) => [item.product_id, item])
    );

    records.forEach((record) => {
      const current = summaryMap.get(record.product_id || "") || {
        product_id: record.product_id || "",
        quantity: 0,
        totalValue: 0,
        totalCost: 0,
        salePrice: record.salePrice || 0,
        unitCost: 0,
        totalTransferredIn: 0,
        totalReturnedOut: 0,
        totalAdjustedOut: 0,
        projectReorderPoint: undefined, // Initialize as undefined
      };

      const action = record.action || "checked_out";
      const quantity = record.quantity || 0;
      const totalValue = record.totalValue || 0;

      if (action === "checked_out") {
        current.totalTransferredIn += quantity;
        current.quantity += quantity;
        current.totalValue += totalValue;
        // Update projectReorderPoint if provided in checkout
        if (record.projectReorderPoint !== undefined) {
          current.projectReorderPoint = record.projectReorderPoint;
          console.log(
            `Setting projectReorderPoint for ${record.product_id}:`,
            record.projectReorderPoint
          );
        }
      } else if (action === "returned") {
        current.totalReturnedOut += quantity;
        current.quantity -= quantity;
        current.totalValue -= totalValue;
      } else if (action === "adjusted") {
        current.totalAdjustedOut += quantity;
        // Adjusted items DO NOT subtract from quantity
      }

      current.totalCost = current.totalValue;

      summaryMap.set(record.product_id || "", current);
    });

    const summary = Array.from(summaryMap.values()).map((item) => {
      const inventoryItem = inventoryMap.get(item.product_id);
      const salePrice = inventoryItem?.salePrice || item.salePrice || 0;

      // Use projectReorderPoint if set (not null/undefined), otherwise fall back to inventory reorderPoint
      const projectReorderPoint = item.projectReorderPoint;
      const inventoryReorderPoint = inventoryItem?.reorderPoint || 0;
      const effectiveReorderPoint =
        projectReorderPoint !== undefined && projectReorderPoint !== null
          ? projectReorderPoint
          : inventoryReorderPoint;

      // Ensure effectiveReorderPoint is always a number
      const safeReorderPoint = effectiveReorderPoint || 0;

      return {
        ...item,
        name: inventoryItem?.name || item.product_id,
        category: inventoryItem?.category || "Uncategorized",
        unit: inventoryItem?.unit || "units",
        supplier: inventoryItem?.supplier || "Gian Construction",
        location: inventoryItem?.location,
        projectReorderPoint: projectReorderPoint ?? undefined, // Convert null to undefined for type compatibility
        isLowStock: Math.max(0, item.quantity) <= safeReorderPoint, // Use safe reorder point
        profitMargin: 0,
        // Ensure quantity and value are non-negative
        quantity: Math.max(0, item.quantity),
        totalValue: Math.max(0, item.totalValue),
        totalCost: Math.max(0, item.totalCost),
      };
    });

    return {
      success: true,
      summary,
    };
  } catch (error: any) {
    console.error("Error fetching inventory summary:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch inventory summary",
    };
  }
}

// Get current project inventory with all details - FIXED: Use projectReorderPoint and proper typing
export async function getCurrentProjectInventory(project_id: string): Promise<{
  success: boolean;
  items?: CurrentInventoryItem[];
  error?: string;
}> {
  await dbConnect();

  try {
    // Get all transactions for this project
    const transactions = (await ProjectInventory.find({ project_id })
      .sort({ createdAt: 1 }) // Sort by date for accurate calculation
      .lean()) as ProjectInventoryDocument[];

    console.log(
      `=== DEBUG: Found ${transactions.length} transactions for project ${project_id} ===`
    );

    // If no transactions, return empty array
    if (transactions.length === 0) {
      console.log("No transactions found for project");
      return {
        success: true,
        items: [],
      };
    }

    // Get all unique product IDs
    const productIds = [
      ...new Set(transactions.map((t) => t.product_id || "")),
    ].filter((id) => id);

    // Get inventory items for details
    const inventoryItems = await Inventory.find({
      product_id: { $in: productIds },
    }).lean();

    const inventoryMap = new Map(
      inventoryItems.map((item: any) => [item.product_id, item])
    );

    // Calculate inventory for each product
    const items: CurrentInventoryItem[] = [];

    // Group transactions by product_id
    const transactionsByProduct = new Map<string, ProjectInventoryDocument[]>();
    transactions.forEach((transaction) => {
      const productId = transaction.product_id || "";
      if (productId) {
        if (!transactionsByProduct.has(productId)) {
          transactionsByProduct.set(productId, []);
        }
        transactionsByProduct.get(productId)!.push(transaction);
      }
    });

    // Process each product
    transactionsByProduct.forEach((productTransactions, productId) => {
      console.log(`\n=== Processing product ${productId} ===`);
      console.log(`Found ${productTransactions.length} transactions`);

      // Log all transactions for this product
      productTransactions.forEach((transaction, index) => {
        console.log(`  Transaction ${index}:`, {
          action: transaction.action,
          quantity: transaction.quantity,
          projectReorderPoint: transaction.projectReorderPoint,
          createdAt: transaction.createdAt,
          notes: transaction.notes?.substring(0, 50) || "none",
        });
      });

      let currentQuantity = 0;
      let totalTransferredIn = 0;
      let totalReturnedOut = 0;
      let totalAdjusted = 0;
      let totalValue = 0;
      let lastTransaction: string | null = null;
      let salePrice = 0;
      let lastProjectInventoryId: string | null = null;
      let projectReorderPoint: number | undefined | null = undefined;
      let projectReorderPointLastUpdated: Date | null = null;

      // Get sale price from inventory
      const inventoryItem = inventoryMap.get(productId);
      if (inventoryItem?.salePrice) {
        salePrice = inventoryItem.salePrice;
      }

      // Process transactions in chronological order
      productTransactions.forEach((transaction, index) => {
        const action = transaction.action || "checked_out";
        const qty = transaction.quantity || 0;
        const transValue = transaction.totalValue || salePrice * qty;

        console.log(
          `  [${index}] ${action} ${qty} pcs, totalValue: ${transValue}`
        );
        console.log(
          `    Before: quantity=${currentQuantity}, totalValue=${totalValue}`
        );

        // Track last transaction ID
        if (
          !lastTransaction ||
          (transaction.createdAt &&
            new Date(transaction.createdAt) > new Date(lastTransaction))
        ) {
          lastTransaction =
            transaction.createdAt?.toString() || new Date().toISOString();
          lastProjectInventoryId = transaction.projectInventory_id || null;
        }

        // CRITICAL FIX: Track project-specific reorder point from ALL checkout transactions
        // Use the MOST RECENT projectReorderPoint from any transaction
        if (transaction.projectReorderPoint !== undefined) {
          const transactionDate = transaction.createdAt
            ? new Date(transaction.createdAt)
            : new Date();
          if (
            !projectReorderPointLastUpdated ||
            transactionDate > projectReorderPointLastUpdated
          ) {
            projectReorderPoint = transaction.projectReorderPoint;
            projectReorderPointLastUpdated = transactionDate;
            console.log(
              `    ✅ Updated projectReorderPoint from transaction: ${projectReorderPoint} (Date: ${transactionDate.toISOString()})`
            );
          }
        }

        if (action === "checked_out") {
          currentQuantity += qty;
          totalTransferredIn += qty;
          totalValue += transValue;
        } else if (action === "returned") {
          currentQuantity -= qty;
          totalReturnedOut += qty;
          totalValue -= transValue;
        } else if (action === "adjusted") {
          // ADJUSTED ITEMS DO NOT SUBTRACT FROM CURRENT QUANTITY
          totalAdjusted += qty;
          // DO NOT: currentQuantity -= qty;
          // DO NOT adjust totalValue for adjusted actions
        }

        console.log(
          `    After:  quantity=${currentQuantity}, totalValue=${totalValue}`
        );
      });

      // Ensure currentQuantity is not negative
      currentQuantity = Math.max(0, currentQuantity);
      // Ensure totalValue is not negative
      totalValue = Math.max(0, totalValue);

      console.log(`  Final calculation:`);
      console.log(`    Starting quantity: 0`);
      console.log(`    Total checked out: ${totalTransferredIn}`);
      console.log(`    Total returned: ${totalReturnedOut}`);
      console.log(`    Total adjusted (tracking only): ${totalAdjusted}`);
      console.log(
        `    Current quantity: ${currentQuantity} (${totalTransferredIn} - ${totalReturnedOut})`
      );
      console.log(`    Total value: ${totalValue}`);
      console.log(
        `    Note: Adjusted items (${totalAdjusted}) tracked separately`
      );
      console.log(
        `    Project reorder point: ${
          projectReorderPoint !== undefined && projectReorderPoint !== null
            ? projectReorderPoint
            : "Not set"
        }`
      );

      // Calculate total cost based on current quantity and sale price
      const totalCost = currentQuantity * salePrice;

      // Determine effective reorder point: project-specific if set, otherwise from inventory
      const effectiveReorderPoint =
        projectReorderPoint !== undefined && projectReorderPoint !== null
          ? projectReorderPoint
          : inventoryItem?.reorderPoint || 0;

      const item: CurrentInventoryItem = {
        product_id: productId,
        name: inventoryItem?.name || productId,
        category: inventoryItem?.category || "Uncategorized",
        unit: inventoryItem?.unit || "units",
        currentQuantity, // This only reflects checked_out - returned
        totalTransferredIn,
        totalReturnedOut,
        totalAdjusted, // This tracks adjusted items separately
        action: "adjusted",
        unitCost: 0,
        totalCost,
        salePrice,
        totalValue: totalValue, // Financial value (not reduced by adjustments)
        supplier: inventoryItem?.supplier || "Gian Construction",
        location: inventoryItem?.location,
        projectReorderPoint: projectReorderPoint ?? undefined, // Convert null to undefined for type compatibility
        isLowStock: currentQuantity <= effectiveReorderPoint, // Use effective reorder point
        profitMargin: 0,
        lastTransaction: lastTransaction || undefined,
        lastProjectInventoryId: lastProjectInventoryId || undefined,
        totalCheckedOut: totalTransferredIn,
        totalReturned: totalReturnedOut,
      };

      items.push(item);
    });

    return {
      success: true,
      items,
    };
  } catch (error: any) {
    console.error("Error fetching current project inventory:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch current inventory",
    };
  }
}

// Get project inventory statistics - UPDATED: Uses projectReorderPoint for low stock calculation
export async function getProjectInventoryStats(project_id: string): Promise<{
  success: boolean;
  stats?: {
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    totalCost: number;
    lowStockItems: number;
    outOfStockItems: number;
    categories: { [key: string]: number };
  };
  error?: string;
}> {
  await dbConnect();

  try {
    const currentInventory = await getCurrentProjectInventory(project_id);

    if (!currentInventory.success || !currentInventory.items) {
      return {
        success: false,
        error: "Failed to fetch inventory data",
      };
    }

    const items = currentInventory.items;
    const totalItems = items.length;
    const totalQuantity = items.reduce(
      (sum, item) => sum + item.currentQuantity,
      0
    );
    const totalValue = items.reduce(
      (sum, item) => sum + (item.totalValue || 0),
      0
    );
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

    // Calculate low stock items based on project reorder point only
    const lowStockItems = items.filter((item) => {
      return (
        item.projectReorderPoint !== undefined &&
        item.currentQuantity <= item.projectReorderPoint
      );
    }).length;

    const outOfStockItems = items.filter(
      (item) => item.currentQuantity === 0
    ).length;

    const categories: { [key: string]: number } = {};
    items.forEach((item) => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });

    return {
      success: true,
      stats: {
        totalItems,
        totalQuantity,
        totalValue,
        totalCost,
        lowStockItems,
        outOfStockItems,
        categories,
      },
    };
  } catch (error: any) {
    console.error("Error fetching inventory stats:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch inventory statistics",
    };
  }
}

// Get project inventory by category (unchanged)
export async function getProjectInventoryByCategory(
  project_id: string
): Promise<{
  success: boolean;
  categories?: Array<{
    category: string;
    items: CurrentInventoryItem[];
    totalQuantity: number;
    totalValue: number;
    totalCost: number;
  }>;
  error?: string;
}> {
  await dbConnect();

  try {
    const currentInventory = await getCurrentProjectInventory(project_id);

    if (!currentInventory.success || !currentInventory.items) {
      return {
        success: false,
        error: "Failed to fetch inventory data",
      };
    }

    const items = currentInventory.items;
    const categoryMap = new Map<string, CurrentInventoryItem[]>();

    items.forEach((item) => {
      const category = item.category || "Uncategorized";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(item);
    });

    const categories = Array.from(categoryMap.entries()).map(
      ([category, categoryItems]) => {
        const totalQuantity = categoryItems.reduce(
          (sum, item) => sum + item.currentQuantity,
          0
        );
        const totalValue = categoryItems.reduce(
          (sum, item) => sum + (item.totalValue || 0),
          0
        );
        const totalCost = categoryItems.reduce(
          (sum, item) => sum + item.totalCost,
          0
        );

        return {
          category,
          items: categoryItems,
          totalQuantity,
          totalValue,
          totalCost,
        };
      }
    );

    return {
      success: true,
      categories,
    };
  } catch (error: any) {
    console.error("Error fetching inventory by category:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch inventory by category",
    };
  }
}
