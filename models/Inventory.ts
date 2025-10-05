import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

// Zod schema for input validation
export const inventorySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  category: z.string().min(1, "Category is required").trim(),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  unit: z.string().min(1, "Unit is required").trim(),
  description: z.string().optional(),
  supplier: z.string().optional(),
  reorderPoint: z.number().min(0, "Reorder point must be non-negative"),
  safetyStock: z
    .number()
    .min(0, "Safety stock must be non-negative")
    .optional(),
  location: z.string().optional(),
  unitCost: z.number().min(0, "Unit cost must be non-negative"),
});

export type InventoryInput = z.infer<typeof inventorySchema>;

// Interface for Mongoose document
export interface IInventoryDoc extends Document {
  item_id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  description?: string;
  supplier?: string;
  reorderPoint: number;
  safetyStock?: number;
  location?: string;
  unitCost: number;
  timeCreated: Date;
  timeUpdated: Date;
}

// Define the schema
const InventorySchema: Schema<IInventoryDoc> = new Schema<IInventoryDoc>(
  {
    item_id: {
      type: String,
      unique: true,
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    supplier: {
      type: String,
    },
    reorderPoint: {
      type: Number,
      default: 0,
    },
    safetyStock: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
    },
    unitCost: {
      type: Number,
      required: true,
      default: 0,
    },
    timeCreated: {
      type: Date,
      default: Date.now,
    },
    timeUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: { createdAt: "timeCreated", updatedAt: "timeUpdated" } }
);

// Add virtuals for compatibility
InventorySchema.virtual("lastUpdated").get(function (this: IInventoryDoc) {
  return this.timeUpdated;
});

InventorySchema.virtual("createdAt").get(function (this: IInventoryDoc) {
  return this.timeCreated;
});

// Ensure virtuals are included in toJSON output
InventorySchema.set("toJSON", { virtuals: true });

// Avoid model overwrite errors in Next.js hot reload
const Inventory: Model<IInventoryDoc> =
  mongoose.models.Inventory ||
  mongoose.model<IInventoryDoc>("Inventory", InventorySchema);

export default Inventory;
