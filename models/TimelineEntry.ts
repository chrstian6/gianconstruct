// models/TimelineEntry.ts
import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// Zod schema for validation
export const TimelineEntryZodSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  message: z.string().optional(),
  photos: z
    .array(
      z.object({
        url: z.string().url("Must be a valid URL"),
        filePath: z.string().min(1, "File path is required"),
        caption: z.string().optional(),
        uploadedBy: z.string().min(1, "Uploader ID is required"),
        uploadedAt: z.date().default(() => new Date()),
      })
    )
    .default([]),
  createdBy: z.string().min(1, "Creator ID is required"),
});

// Interface for Mongoose document
export interface ITimelineEntryDocument
  extends Document,
    z.infer<typeof TimelineEntryZodSchema> {}

// Define the Mongoose schema
const timelineEntrySchema = new Schema(
  {
    projectId: {
      type: String,
      required: true,
      ref: "Project",
    },
    date: {
      type: String, // Stored as YYYY-MM-DD
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    photos: [
      {
        url: {
          type: String,
          required: true,
        },
        filePath: {
          type: String,
          required: true,
        },
        caption: {
          type: String,
          default: "",
        },
        uploadedBy: {
          type: String,
          required: true,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: String,
      required: true,
      ref: "User",
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

// Compound index for efficient querying
timelineEntrySchema.index({ projectId: 1, date: 1 }, { unique: true });
timelineEntrySchema.index({ createdAt: -1 });

// Pre-save validation hook using Zod
timelineEntrySchema.pre("save", function (next) {
  try {
    const doc = this.toObject();

    const validationData = {
      projectId: doc.projectId,
      date: doc.date,
      message: doc.message,
      photos: doc.photos,
      createdBy: doc.createdBy,
    };

    TimelineEntryZodSchema.parse(validationData);
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
delete mongoose.models.TimelineEntry;
const TimelineEntryModel =
  mongoose.models.TimelineEntry ||
  mongoose.model<ITimelineEntryDocument>("TimelineEntry", timelineEntrySchema);

export default TimelineEntryModel;
