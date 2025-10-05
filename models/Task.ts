// models/Task.ts
import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// Zod schema for validation
export const TaskZodSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["not-started", "in-progress", "completed", "pending"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date().optional(),
  assignedTo: z.string().optional(),
  project_id: z.string().min(1, "Project ID is required"),
});

// Interface for Mongoose document
export interface ITaskDocument
  extends Document,
    z.infer<typeof TaskZodSchema> {}

// Define the Mongoose schema
const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["not-started", "in-progress", "completed", "pending"],
      default: "not-started",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    assignedTo: {
      type: String,
      trim: true,
    },
    project_id: {
      type: String,
      required: true,
      ref: "Project",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret._id = ret._id.toString();
        ret.createdAt = ret.createdAt.toISOString();
        ret.updatedAt = ret.updatedAt.toISOString();
        delete ret.__v;
      },
    },
  }
);

// Pre-save validation hook using Zod
taskSchema.pre("save", function (next) {
  try {
    const doc = this.toObject();
    const validationData = {
      title: doc.title,
      description: doc.description,
      status: doc.status,
      priority: doc.priority,
      dueDate: doc.dueDate,
      assignedTo: doc.assignedTo,
      project_id: doc.project_id,
    };

    TaskZodSchema.parse(validationData);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((err) => err.message).join(", ");
      next(new Error(`Validation failed: ${errorMessage}`));
    } else {
      next(error as Error);
    }
  }
});

// Pre-update validation hook using Zod
taskSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate() as any;
    const docToUpdate = await this.model.findOne(this.getQuery());

    if (!docToUpdate) {
      return next(new Error("Document not found for update"));
    }

    const originalDoc = docToUpdate.toObject();
    const updatedDoc = { ...originalDoc, ...update.$set };

    const validationData = {
      title: updatedDoc.title,
      description: updatedDoc.description,
      status: updatedDoc.status,
      priority: updatedDoc.priority,
      dueDate: updatedDoc.dueDate,
      assignedTo: updatedDoc.assignedTo,
      project_id: updatedDoc.project_id,
    };

    TaskZodSchema.parse(validationData);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((err) => err.message).join(", ");
      next(new Error(`Validation failed: ${errorMessage}`));
    } else {
      next(error as Error);
    }
  }
});

// Ensure the model is recreated to apply the schema
delete mongoose.models.Task;
const TaskModel =
  mongoose.models.Task || mongoose.model<ITaskDocument>("Task", taskSchema);

export default TaskModel;
