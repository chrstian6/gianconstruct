// models/ProjectAssignment.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProjectAssignmentDocument extends Document {
  assignment_id: string;
  project_id: string;
  project_manager_id: string;
  assigned_by: string;
  assignment_date: Date;
  status: "active" | "completed" | "transferred";
  notes?: string;
  transferred_to?: string;
  transferred_date?: Date;
  completed_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Separate Counter Document interface - without extending Document
interface ICounterDocument {
  _id: string;
  sequence_value: number;
}

const projectAssignmentSchema = new Schema<IProjectAssignmentDocument>(
  {
    assignment_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    project_id: {
      type: String,
      required: true,
      ref: "Project",
    },
    project_manager_id: {
      type: String,
      required: true,
      ref: "User",
    },
    assigned_by: {
      type: String,
      required: true,
    },
    assignment_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "completed", "transferred"],
      default: "active",
    },
    notes: {
      type: String,
      trim: true,
    },
    transferred_to: {
      type: String,
      ref: "User",
    },
    transferred_date: {
      type: Date,
    },
    completed_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        // Convert _id to string
        if (ret._id && ret._id instanceof Types.ObjectId) {
          ret._id = ret._id.toString();
        } else if (
          ret._id &&
          typeof ret._id === "object" &&
          "toString" in ret._id
        ) {
          ret._id = ret._id.toString();
        }

        // Convert dates to ISO strings
        const dateFields = [
          "assignment_date",
          "transferred_date",
          "completed_at",
          "createdAt",
          "updatedAt",
        ];

        dateFields.forEach((field) => {
          if (ret[field] && ret[field] instanceof Date) {
            ret[field] = ret[field].toISOString();
          } else if (ret[field] && typeof ret[field] === "string") {
            // Ensure it's a valid date string
            try {
              const date = new Date(ret[field]);
              if (!isNaN(date.getTime())) {
                ret[field] = date.toISOString();
              }
            } catch (error) {
              // Keep the original value if it's not a valid date
              console.warn(`Invalid date in ${field}:`, ret[field]);
            }
          }
        });

        // Remove __v
        if (ret.__v !== undefined) {
          delete ret.__v;
        }
      },
    },
  }
);

// Indexes for better query performance
projectAssignmentSchema.index({ project_id: 1 });
projectAssignmentSchema.index({ project_manager_id: 1 });
projectAssignmentSchema.index({ status: 1 });
projectAssignmentSchema.index({ assignment_date: -1 });

// Counter schema - simpler approach without extending Document
const counterSchema = new Schema<ICounterDocument>(
  {
    _id: { type: String, required: true },
    sequence_value: { type: Number, default: 0 },
  },
  {
    // Disable _id field since we're using _id as string
    _id: false,
  }
);

// Helper function to get or create counter model
function getCounterModel() {
  try {
    // Check if Counter model already exists
    if (mongoose.models.Counter) {
      return mongoose.models.Counter as mongoose.Model<ICounterDocument>;
    }
    // Create new model
    return mongoose.model<ICounterDocument>("Counter", counterSchema);
  } catch (error) {
    // If there's an error getting the model, create a fresh one
    delete mongoose.models.Counter;
    return mongoose.model<ICounterDocument>("Counter", counterSchema);
  }
}

// Pre-save hook to generate assignment_id
projectAssignmentSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const Counter = getCounterModel();

      // Find and update counter
      const result = await Counter.findOneAndUpdate(
        { _id: "assignment_id" },
        { $inc: { sequence_value: 1 } },
        {
          new: true,
          upsert: true,
          // Use raw result to avoid type issues
          lean: true,
        }
      );

      if (!result) {
        throw new Error("Failed to generate assignment ID");
      }

      const sequenceNumber = result.sequence_value.toString().padStart(4, "0");
      this.assignment_id = `assign-${sequenceNumber}`;
    } catch (error) {
      console.error("Error generating assignment ID:", error);
      // Fallback: use timestamp-based ID
      const timestamp = Date.now().toString().slice(-6);
      this.assignment_id = `assign-${timestamp}`;
    }
  }
  next();
});

// Middleware to ensure proper date handling
projectAssignmentSchema.pre("save", function (next) {
  // Ensure dates are properly set
  if (this.isNew && !this.assignment_date) {
    this.assignment_date = new Date();
  }
  next();
});

// Create or get model
const ProjectAssignmentModel =
  (mongoose.models
    .ProjectAssignment as mongoose.Model<IProjectAssignmentDocument>) ||
  mongoose.model<IProjectAssignmentDocument>(
    "ProjectAssignment",
    projectAssignmentSchema
  );

export default ProjectAssignmentModel;
