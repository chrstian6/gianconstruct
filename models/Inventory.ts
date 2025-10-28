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
  location: z.string().optional(),
  unitCost: z.number().min(0, "Unit cost must be non-negative"),
  salePrice: z.number().min(0, "Sale price must be non-negative").optional(),
});

export type InventoryInput = z.infer<typeof inventorySchema>;

// Interface for Mongoose document
export interface IInventoryDoc extends Document {
  product_id: string;
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
  timeCreated: Date;
  timeUpdated: Date;
}

// Define the schema
const InventorySchema: Schema<IInventoryDoc> = new Schema<IInventoryDoc>(
  {
    product_id: {
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
    location: {
      type: String,
    },
    unitCost: {
      type: Number,
      required: true,
      default: 0,
    },
    salePrice: {
      type: Number,
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

// Virtual for total capital value (unitCost * quantity)
InventorySchema.virtual("totalCapital").get(function (this: IInventoryDoc) {
  return this.quantity * this.unitCost;
});

// Virtual for total sale value (salePrice * quantity)
InventorySchema.virtual("totalValue").get(function (this: IInventoryDoc) {
  return this.quantity * (this.salePrice || 0);
});

// Ensure virtuals are included in toJSON output
InventorySchema.set("toJSON", { virtuals: true });

// Avoid model overwrite errors in Next.js hot reload
const Inventory: Model<IInventoryDoc> =
  mongoose.models.Inventory ||
  mongoose.model<IInventoryDoc>("Inventory", InventorySchema);

export default Inventory;
