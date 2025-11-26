// models/Document.ts
import mongoose, { Schema, Document as MongoDocument } from "mongoose";
import { z } from "zod";
import { DocumentZodSchema } from "@/types/document";

// Interface for Mongoose document
interface IDocumentDocument
  extends MongoDocument,
    Omit<z.infer<typeof DocumentZodSchema>, "_id" | "doc_id"> {
  doc_id: string;
}

// Define the Mongoose schema
const documentSchema = new Schema(
  {
    doc_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    project_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    original_name: {
      type: String,
      required: true,
      trim: true,
    },
    file_path: {
      type: String,
      required: true,
    },
    file_url: {
      type: String,
      required: true,
    },
    file_type: {
      type: String,
      required: true,
      trim: true,
    },
    file_size: {
      type: Number,
      required: true,
      min: 0,
    },
    mime_type: {
      type: String,
      required: true,
      trim: true,
    },
    uploaded_by: {
      type: String,
      required: true,
      trim: true,
    },
    uploaded_by_name: {
      type: String,
      required: true,
      trim: true,
    },
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret._id = ret._id.toString();
        ret.doc_id = ret.doc_id;
        ret.uploaded_at = ret.uploaded_at.toISOString();
        ret.createdAt = ret.createdAt?.toISOString();
        ret.updatedAt = ret.updatedAt?.toISOString();
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
documentSchema.pre("save", function (next) {
  try {
    const doc = this.toObject();

    const validationData = {
      doc_id: doc.doc_id,
      project_id: doc.project_id,
      name: doc.name,
      original_name: doc.original_name,
      file_path: doc.file_path,
      file_url: doc.file_url,
      file_type: doc.file_type,
      file_size: doc.file_size,
      mime_type: doc.mime_type,
      uploaded_by: doc.uploaded_by,
      uploaded_by_name: doc.uploaded_by_name,
      uploaded_at: doc.uploaded_at,
    };

    DocumentZodSchema.parse(validationData);
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
documentSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate() as any;
    const docToUpdate = await this.model.findOne(this.getQuery());

    if (!docToUpdate) {
      return next(new Error("Document not found for update"));
    }

    const originalDoc = docToUpdate.toObject();
    const updatedDoc = { ...originalDoc, ...update.$set };

    const validationData = {
      doc_id: updatedDoc.doc_id,
      project_id: updatedDoc.project_id,
      name: updatedDoc.name,
      original_name: updatedDoc.original_name,
      file_path: updatedDoc.file_path,
      file_url: updatedDoc.file_url,
      file_type: updatedDoc.file_type,
      file_size: updatedDoc.file_size,
      mime_type: updatedDoc.mime_type,
      uploaded_by: updatedDoc.uploaded_by,
      uploaded_by_name: updatedDoc.uploaded_by_name,
      uploaded_at: updatedDoc.uploaded_at,
    };

    DocumentZodSchema.parse(validationData);
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
delete mongoose.models.Document;
const DocumentModel =
  mongoose.models.Document ||
  mongoose.model<IDocumentDocument>("Document", documentSchema);

export default DocumentModel;
