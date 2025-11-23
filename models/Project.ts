import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";
import { ProjectPreSaveZodSchema } from "@/types/project";

// Interface for project image
interface IProjectImage {
  url: string;
  title: string;
  description?: string;
  uploadedAt: Date;
}

// Interface for location
interface ILocation {
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  fullAddress: string;
}

// Interface for Mongoose document
interface IProjectDocument
  extends Document,
    Omit<z.infer<typeof ProjectPreSaveZodSchema>, "_id"> {
  location?: ILocation;
  projectImages?: IProjectImage[];
  // Add confirmation fields
  confirmedAt?: Date;
  confirmedBy?: string;
}

// Define the Mongoose schema
const projectSchema = new Schema(
  {
    project_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"], // REMOVED "not-started"
      default: "pending", // CHANGED from "not-started" to "pending"
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: false,
    },
    userId: {
      type: String,
      required: true,
    },
    totalCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    location: {
      type: {
        region: { type: String, required: false },
        province: { type: String, required: false },
        municipality: { type: String, required: false },
        barangay: { type: String, required: false },
        fullAddress: { type: String, required: false },
      },
      required: false,
    },
    projectImages: [
      {
        url: { type: String, required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // Add confirmation fields
    confirmedAt: {
      type: Date,
      required: false,
    },
    confirmedBy: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret._id = ret._id.toString();
        ret.createdAt = ret.createdAt.toISOString();
        ret.updatedAt = ret.updatedAt.toISOString();
        // Ensure projectImages is properly formatted
        if (ret.projectImages) {
          ret.projectImages = ret.projectImages.map((image: any) => ({
            url: image.url,
            title: image.title,
            description: image.description,
            uploadedAt: image.uploadedAt,
          }));
        }
        delete ret.__v;
      },
    },
  }
);

// Improved error formatting function
function formatZodErrors(errors: z.ZodError["errors"]): string {
  return errors
    .map((err) => {
      const path = err.path.join(".") || "unknown field";
      return `${path}: ${err.message}`;
    })
    .join("; ");
}

// Pre-save validation hook using Zod
projectSchema.pre("save", function (next) {
  try {
    const doc = this.toObject();
    console.log("Pre-save document:", doc);

    const validationData = {
      project_id: doc.project_id,
      name: doc.name,
      status: doc.status,
      startDate: doc.startDate,
      endDate: doc.endDate,
      userId: doc.userId,
      totalCost: doc.totalCost,
      location: doc.location,
      projectImages: doc.projectImages,
      confirmedAt: doc.confirmedAt,
      confirmedBy: doc.confirmedBy,
    };

    console.log("Validation data:", validationData);
    ProjectPreSaveZodSchema.parse(validationData);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Zod validation errors:", error.errors);
      const errorMessage = formatZodErrors(error.errors);
      next(new Error(`Validation failed: ${errorMessage}`));
    } else {
      next(error as Error);
    }
  }
});

// Pre-update validation hook using Zod
projectSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate() as any;
    const docToUpdate = await this.model.findOne(this.getQuery());

    if (!docToUpdate) {
      return next(new Error("Document not found for update"));
    }

    const originalDoc = docToUpdate.toObject();
    const updatedDoc = { ...originalDoc, ...update.$set };

    console.log("Pre-update document:", updatedDoc);

    const validationData = {
      project_id: updatedDoc.project_id,
      name: updatedDoc.name,
      status: updatedDoc.status,
      startDate: updatedDoc.startDate,
      endDate: updatedDoc.endDate,
      userId: updatedDoc.userId,
      totalCost: updatedDoc.totalCost,
      location: updatedDoc.location,
      projectImages: updatedDoc.projectImages,
      confirmedAt: updatedDoc.confirmedAt,
      confirmedBy: updatedDoc.confirmedBy,
    };

    console.log("Validation data:", validationData);
    ProjectPreSaveZodSchema.parse(validationData);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Zod validation errors:", error.errors);
      const errorMessage = formatZodErrors(error.errors);
      next(new Error(`Validation failed: ${errorMessage}`));
    } else {
      next(error as Error);
    }
  }
});

// Ensure the model is recreated to apply the schema
delete mongoose.models.Project;
const ProjectModel =
  mongoose.models.Project ||
  mongoose.model<IProjectDocument>("Project", projectSchema);
export default ProjectModel;
