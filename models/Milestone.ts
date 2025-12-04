import { Schema, model, models, Document } from "mongoose";

export interface IMilestone extends Document {
  project_id: string;
  title: string;
  description?: string;
  progress: number;
  target_date?: Date;
  completed: boolean;
  completed_at?: Date;
  order: number;
  created_at: Date;
  updated_at: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  project_id: {
    type: String,
    required: [true, "Project ID is required"],
    index: true,
  },
  title: {
    type: String,
    required: [true, "Milestone title is required"],
    trim: true,
    maxlength: [200, "Title cannot be more than 200 characters"],
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot be more than 500 characters"],
  },
  progress: {
    type: Number,
    required: [true, "Progress is required"],
    min: [0, "Progress cannot be less than 0"],
    max: [100, "Progress cannot be more than 100"],
    default: 0,
  },
  target_date: {
    type: Date,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completed_at: {
    type: Date,
  },
  order: {
    type: Number,
    required: [true, "Order is required"],
    min: 0,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update the updated_at field before saving
MilestoneSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Calculate completed status based on progress
MilestoneSchema.pre("save", function (next) {
  if (this.progress === 100 && !this.completed) {
    this.completed = true;
    this.completed_at = new Date();
  } else if (this.progress < 100 && this.completed) {
    this.completed = false;
    this.completed_at = undefined;
  }
  next();
});

export default models?.Milestone ||
  model<IMilestone>("Milestone", MilestoneSchema);
