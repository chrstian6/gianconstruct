"use server";

import dbConnect from "@/lib/db";
import Inventory, {
  IInventoryDoc,
  InventoryInput,
  inventorySchema,
} from "@/models/Inventory";
import { IInventory } from "@/types/Inventory";

// Generate product_id synchronously in xxxx-xxxx format
function generateProductId(): string {
  // Generate 8 random digits
  const numbers = Math.floor(10000000 + Math.random() * 90000000)
    .toString()
    .padStart(8, "0");
  return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
}

// Helper function to convert Mongoose document or plain object to IInventory
function convertToIInventory(doc: any): IInventory {
  // Extract plain object from Mongoose document if needed
  const plainObj =
    doc && typeof doc === "object"
      ? doc.toObject
        ? doc.toObject()
        : doc
      : doc;

  return {
    product_id: plainObj.product_id || "",
    name: plainObj.name || "",
    category: plainObj.category || "",
    quantity: plainObj.quantity || 0,
    unit: plainObj.unit || "",
    description: plainObj.description || undefined,
    supplier: plainObj.supplier || undefined,
    reorderPoint: plainObj.reorderPoint || 0,
    location: plainObj.location || undefined,
    unitCost: plainObj.unitCost || 0,
    salePrice: plainObj.salePrice || undefined,
    totalCapital:
      plainObj.totalCapital ||
      (plainObj.quantity || 0) * (plainObj.unitCost || 0),
    totalValue:
      plainObj.totalValue ||
      (plainObj.quantity || 0) * (plainObj.salePrice || 0),
    timeCreated: plainObj.timeCreated
      ? new Date(plainObj.timeCreated).toISOString()
      : new Date().toISOString(),
    timeUpdated: plainObj.timeUpdated
      ? new Date(plainObj.timeUpdated).toISOString()
      : new Date().toISOString(),
    lastUpdated: plainObj.timeUpdated
      ? new Date(plainObj.timeUpdated).toISOString()
      : undefined,
    createdAt: plainObj.timeCreated
      ? new Date(plainObj.timeCreated).toISOString()
      : undefined,
  };
}

// Fetch all items
export async function getInventories(): Promise<IInventory[]> {
  await dbConnect();
  try {
    const items = await Inventory.find().sort({ timeCreated: -1 }).lean();
    return items.map((item) => convertToIInventory(item));
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

// Create item - DON'T include product_id in the input data
export async function createInventory(
  data: Omit<InventoryInput, "product_id">
) {
  await dbConnect();
  try {
    // Validate input with Zod (excluding product_id)
    const validatedData = inventorySchema.parse(data);

    // Ensure product_id is not in the input data
    if ((data as any).product_id) {
      throw new Error("product_id should not be provided in input data");
    }

    // Generate unique product_id
    let product_id: string;
    let attempts = 0;
    const maxAttempts = 5;
    do {
      product_id = generateProductId();
      const existing = await Inventory.findOne({ product_id }).lean();
      if (!existing) break;
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error(
          "Failed to generate unique product_id after multiple attempts"
        );
      }
    } while (true);

    // Create new item
    const newItem = new Inventory({
      ...validatedData,
      product_id,
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

// Create batch inventory
export async function createBatchInventory(
  items: Omit<InventoryInput, "product_id">[]
) {
  await dbConnect();
  try {
    const createdItems = [];

    for (const itemData of items) {
      // Validate input with Zod
      const validatedData = inventorySchema.parse(itemData);

      // Generate unique product_id for each item
      let product_id: string;
      let attempts = 0;
      const maxAttempts = 5;
      do {
        product_id = generateProductId();
        const existing = await Inventory.findOne({ product_id }).lean();
        if (!existing) break;
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(
            "Failed to generate unique product_id after multiple attempts"
          );
        }
      } while (true);

      // Create new item with correct field mapping
      const newItem = new Inventory({
        name: validatedData.name,
        category: validatedData.category,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        description: validatedData.description,
        supplier: validatedData.supplier,
        reorderPoint: validatedData.reorderPoint,
        location: validatedData.location,
        unitCost: validatedData.unitCost,
        salePrice: validatedData.salePrice,
        product_id: product_id,
        timeCreated: new Date(),
        timeUpdated: new Date(),
      });

      await newItem.save();
      createdItems.push(convertToIInventory(newItem));
    }

    return {
      success: true,
      items: createdItems,
      count: createdItems.length,
    };
  } catch (error: any) {
    console.error("Error creating batch inventory:", error);

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
      error: error instanceof Error ? error.message : "Failed to create items",
    };
  }
}

// Update item
export async function updateInventory(
  product_id: string,
  data: Partial<Omit<InventoryInput, "product_id">>
) {
  await dbConnect();
  try {
    // Validate product_id is a string in xxxx-xxxx format
    if (typeof product_id !== "string" || !/^\d{4}-\d{4}$/.test(product_id)) {
      throw new Error("product_id must be a string in xxxx-xxxx format");
    }

    // Validate partial input with Zod (excluding product_id)
    const validatedData = inventorySchema.partial().parse(data);

    const updated = await Inventory.findOneAndUpdate(
      { product_id },
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

// Delete item using product_id
export async function deleteInventory(product_id: string) {
  await dbConnect();
  try {
    // Validate product_id is a string in xxxx-xxxx format
    if (typeof product_id !== "string" || !/^\d{4}-\d{4}$/.test(product_id)) {
      throw new Error("product_id must be a string in xxxx-xxxx format");
    }

    const deleted = await Inventory.findOneAndDelete({ product_id });
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
export async function getInventoryById(product_id: string) {
  await dbConnect();
  try {
    // Validate product_id is a string in xxxx-xxxx format
    if (typeof product_id !== "string" || !/^\d{4}-\d{4}$/.test(product_id)) {
      throw new Error("product_id must be a string in xxxx-xxxx format");
    }

    const item = await Inventory.findOne({ product_id }).lean();
    if (!item) return { success: false, error: "Item not found" };

    return {
      success: true,
      item: convertToIInventory(item),
    };
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch item",
    };
  }
}

// Get inventory by category
export async function getInventoryByCategory(): Promise<
  {
    category: string;
    items: { name: string; quantity: number; reorderPoint: number }[];
  }[]
> {
  await dbConnect();
  try {
    const items = await Inventory.find().sort({ category: 1, name: 1 }).lean();

    // Group items by category
    const categoryMap = new Map<
      string,
      { name: string; quantity: number; reorderPoint: number }[]
    >();

    items.forEach((item) => {
      const inventoryItem = convertToIInventory(item);
      if (!categoryMap.has(inventoryItem.category)) {
        categoryMap.set(inventoryItem.category, []);
      }
      categoryMap.get(inventoryItem.category)?.push({
        name: inventoryItem.name,
        quantity: inventoryItem.quantity,
        reorderPoint: inventoryItem.reorderPoint,
      });
    });

    // Convert to array format
    const result = Array.from(categoryMap.entries()).map(
      ([category, items]) => ({
        category,
        items,
      })
    );

    return result;
  } catch (error) {
    console.error("Error fetching inventory by category:", error);
    return [];
  }
}
