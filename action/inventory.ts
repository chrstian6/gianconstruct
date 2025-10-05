"use server";

import dbConnect from "@/lib/db";
import Inventory, {
  IInventoryDoc,
  InventoryInput,
  inventorySchema,
} from "@/models/Inventory";
import { IInventory } from "@/types/Inventory";

// Generate item_id synchronously in xxxx-xxxx format
function generateItemId(): string {
  // Generate 8 random digits
  const numbers = Math.floor(10000000 + Math.random() * 90000000)
    .toString()
    .padStart(8, "0");
  return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
}

// Generate simple SKU based on name and timestamp
function generateSKU(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 5)
    .toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `SKU-${prefix}-${timestamp}`;
}

// Helper function to convert Mongoose document to IInventory
function convertToIInventory(doc: IInventoryDoc | any): IInventory {
  const plainDoc = doc.toObject ? doc.toObject() : doc;

  // Make sure we're using item_id, not itemId
  const item_id = plainDoc.item_id || plainDoc.itemId;

  return {
    item_id: item_id,
    sku: plainDoc.sku,
    name: plainDoc.name,
    category: plainDoc.category,
    quantity: plainDoc.quantity,
    unit: plainDoc.unit,
    description: plainDoc.description,
    supplier: plainDoc.supplier,
    reorderPoint: plainDoc.reorderPoint,
    safetyStock: plainDoc.safetyStock,
    location: plainDoc.location,
    unitCost: plainDoc.unitCost,
    timeCreated: plainDoc.timeCreated
      ? new Date(plainDoc.timeCreated).toISOString()
      : new Date().toISOString(),
    timeUpdated: plainDoc.timeUpdated
      ? new Date(plainDoc.timeUpdated).toISOString()
      : new Date().toISOString(),
    lastUpdated: plainDoc.timeUpdated
      ? new Date(plainDoc.timeUpdated).toISOString()
      : undefined,
    createdAt: plainDoc.timeCreated
      ? new Date(plainDoc.timeCreated).toISOString()
      : undefined,
  };
}

// Fetch all items
export async function getInventories(): Promise<IInventory[]> {
  await dbConnect();
  try {
    const items = await Inventory.find().sort({ timeCreated: -1 }).lean();
    return items.map((item) => convertToIInventory(item as IInventoryDoc));
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

// Fetch all unique categories
export async function getCategories(): Promise<string[]> {
  await dbConnect();
  try {
    const categories = await Inventory.distinct("category");
    return categories
      .filter(
        (category): category is string =>
          category !== null && category !== "" && typeof category === "string"
      )
      .sort();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Create item - DON'T include item_id or sku in the input data
export async function createInventory(
  data: Omit<InventoryInput, "item_id" | "sku">
) {
  await dbConnect();
  try {
    // Validate input with Zod (excluding item_id and sku)
    const validatedData = inventorySchema.parse(data);

    // Ensure item_id and sku are not in the input data
    if ((data as any).item_id || (data as any).sku) {
      throw new Error("item_id and sku should not be provided in input data");
    }

    // Generate unique item_id
    let item_id: string;
    let attempts = 0;
    const maxAttempts = 5;
    do {
      item_id = generateItemId();
      const existing = await Inventory.findOne({ item_id }).lean();
      if (!existing) break;
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error(
          "Failed to generate unique item_id after multiple attempts"
        );
      }
    } while (true);

    // Generate unique sku
    const sku = generateSKU(validatedData.name);

    // Create new item
    const newItem = new Inventory({
      ...validatedData,
      item_id,
      sku,
      timeCreated: new Date(),
      timeUpdated: new Date(),
    });

    await newItem.save();

    return {
      success: true,
      item: convertToIInventory(newItem),
    };
  } catch (error: any) {
    console.error("Error creating inventory:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return {
        success: false,
        error: `An item with this ${field} already exists.`,
      };
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      const errors = error.errors.map(
        (err: any) => `${err.path.join(".")}: ${err.message}`
      );
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    // Handle Promise error specifically
    if (error.message.includes("Cast to string failed for value")) {
      return {
        success: false,
        error: "Invalid input: A Promise was provided instead of a valid value",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create item",
    };
  }
}

// Update item
export async function updateInventory(
  item_id: string,
  data: Partial<Omit<InventoryInput, "item_id" | "sku">>
) {
  await dbConnect();
  try {
    // Validate item_id is a string in xxxx-xxxx format
    if (typeof item_id !== "string" || !/^\d{4}-\d{4}$/.test(item_id)) {
      throw new Error("item_id must be a string in xxxx-xxxx format");
    }

    // Validate partial input with Zod (excluding item_id and sku)
    const validatedData = inventorySchema.partial().parse(data);

    const updated = await Inventory.findOneAndUpdate(
      { item_id },
      { ...validatedData, timeUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!updated) return { success: false, error: "Item not found" };

    return {
      success: true,
      item: convertToIInventory(updated),
    };
  } catch (error: any) {
    console.error("Error updating inventory:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return {
        success: false,
        error: `An item with this ${field} already exists.`,
      };
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      const errors = error.errors.map(
        (err: any) => `${err.path.join(".")}: ${err.message}`
      );
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update item",
    };
  }
}

// Delete item
export async function deleteInventory(item_id: string) {
  await dbConnect();
  try {
    // Validate item_id is a string in xxxx-xxxx format
    if (typeof item_id !== "string" || !/^\d{4}-\d{4}$/.test(item_id)) {
      throw new Error("item_id must be a string in xxxx-xxxx format");
    }

    const deleted = await Inventory.findOneAndDelete({ item_id });
    if (!deleted) return { success: false, error: "Item not found" };

    return {
      success: true,
      item: convertToIInventory(deleted),
    };
  } catch (error) {
    console.error("Error deleting inventory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete item",
    };
  }
}

// Get single item by ID
export async function getInventoryById(item_id: string) {
  await dbConnect();
  try {
    // Validate item_id is a string in xxxx-xxxx format
    if (typeof item_id !== "string" || !/^\d{4}-\d{4}$/.test(item_id)) {
      throw new Error("item_id must be a string in xxxx-xxxx format");
    }

    const item = await Inventory.findOne({ item_id }).lean();
    if (!item) return { success: false, error: "Item not found" };

    return {
      success: true,
      item: convertToIInventory(item as IInventoryDoc),
    };
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch item",
    };
  }
}

// action/inventory.ts (update the getInventoryByCategory function)
export async function getInventoryByCategory(): Promise<{category: string; items: {name: string; quantity: number; reorderPoint: number; safetyStock?: number}[]}[]> {
  await dbConnect();
  try {
    const items = await Inventory.find().sort({ category: 1, name: 1 }).lean();

    // Group items by category
    const categoryMap = new Map<string, {name: string; quantity: number; reorderPoint: number; safetyStock?: number}[]>();

    items.forEach((item) => {
      const inventoryItem = convertToIInventory(item as IInventoryDoc);
      if (!categoryMap.has(inventoryItem.category)) {
        categoryMap.set(inventoryItem.category, []);
      }
      categoryMap.get(inventoryItem.category)?.push({
        name: inventoryItem.name,
        quantity: inventoryItem.quantity,
        reorderPoint: inventoryItem.reorderPoint,
        safetyStock: inventoryItem.safetyStock
      });
    });

    // Convert to array format
    const result = Array.from(categoryMap.entries()).map(([category, items]) => ({
      category,
      items
    }));

    return result;
  } catch (error) {
    console.error("Error fetching inventory by category:", error);
    return [];
  }
}