// models/ProjectInventory.ts - UPDATED VERSION
import mongoose, { Schema, Document } from "mongoose";

export interface IProjectInventory extends Document {
  projectInventory_id: string;
  project_id: string;
  product_id: string;
  quantity: number;
  unit: string;
  supplier: string;
  notes?: string;
  action: "checked_out" | "returned" | "adjusted" | "used";
  salePrice: number;
  totalValue: number;
  projectReorderPoint?: number; // Optional field
  action_by: {
    user_id: string;
    name: string;
    role: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProjectInventorySchema = new Schema<IProjectInventory>(
  {
    projectInventory_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    project_id: {
      type: String,
      required: true,
      index: true,
    },
    product_id: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0, // ✅ CHANGED: Allow 0 for setting reorder points
    },
    unit: {
      type: String,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
      default: "Gian Construction",
    },
    notes: {
      type: String,
    },
    action: {
      type: String,
      enum: ["checked_out", "returned", "adjusted", "used"],
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalValue: {
      type: Number,
      required: true,
      default: 0,
    },
    projectReorderPoint: {
      type: Number,
      default: null,
    },
    action_by: {
      user_id: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for unitCost (for backward compatibility)
ProjectInventorySchema.virtual("unitCost").get(function (
  this: IProjectInventory
) {
  return 0;
});

// Virtual for totalCost (alias for totalValue for clarity)
ProjectInventorySchema.virtual("totalCost").get(function (
  this: IProjectInventory
) {
  return this.totalValue;
});

// Create index for efficient queries
ProjectInventorySchema.index({ project_id: 1, createdAt: -1 });
ProjectInventorySchema.index({ product_id: 1 });
ProjectInventorySchema.index({ salePrice: 1 });
ProjectInventorySchema.index({ totalValue: 1 });
ProjectInventorySchema.index({ projectReorderPoint: 1 });

const ProjectInventory =
  mongoose.models.ProjectInventory ||
  mongoose.model<IProjectInventory>("ProjectInventory", ProjectInventorySchema);

export default ProjectInventory;
