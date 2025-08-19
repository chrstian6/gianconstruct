import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// Combined Mongoose + Zod implementation
const DesignSchema: Schema = new Schema(
  {
    design_id: {
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
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    number_of_rooms: {
      type: Number,
      required: true,
      min: 1,
    },
    square_meters: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        type: String,
        required: true,
        validate: {
          validator: (value: string) => {
            try {
              new URL(value);
              return true;
            } catch {
              return false;
            }
          },
          message: "Image must be a valid URL",
        },
      },
    ],
    createdBy: {
      type: String,
      required: true,
      trim: true,
      default: "Admin",
    },
    isLoanOffer: {
      type: Boolean,
      required: true,
      default: false,
    },
    maxLoanTerm: {
      type: Number,
      min: 1,
      max: 360,
      required: false,
      default: null,
    },
    interestRate: {
      type: Number,
      min: 0,
      required: false,
      default: null,
    },
    interestRateType: {
      type: String,
      enum: ["monthly", "yearly"],
      required: false,
      default: "yearly",
    },
    loanTermType: {
      type: String,
      enum: ["months", "years"],
      required: false,
      default: "years",
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

// Zod schema for pre-save validation (only user-controlled fields)

const DesignPreSaveZodSchema = z.object({
  design_id: z.string().min(1, "Design ID is required"),
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().min(1, "Description is required").trim(),
  price: z.number().min(0, "Price must be positive"),
  number_of_rooms: z.number().min(1, "At least one room required"),
  square_meters: z.number().min(0, "Area must be positive"),
  category: z.string().min(1, "Category is required").trim(),
  images: z.array(z.string().url()).min(1, "At least one image required"),
  createdBy: z.string().min(1, "Creator is required").trim().default("Admin"),
  isLoanOffer: z.boolean().default(false),
  maxLoanTerm: z.number().min(1).max(360).nullable().optional(),
  interestRate: z.number().min(0).nullable().optional(),
  interestRateType: z.enum(["monthly", "yearly"]).default("yearly"),
  loanTermType: z.enum(["months", "years"]).default("years"),
});

// Zod schema for full document (including timestamps for API responses)
export const DesignZodSchema = DesignPreSaveZodSchema.extend({
  _id: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Type derived from full Zod schema
export type IDesign = z.infer<typeof DesignZodSchema>;

// Mongoose Document Interface
interface IDesignDocument extends Document, Omit<IDesign, "_id"> {}

// Add schema validation hooks
DesignSchema.pre("save", function (next) {
  try {
    const doc = this.toObject();
    console.log("Pre-save document:", doc);

    // Extract only the fields that should be validated
    const validationData = {
      design_id: doc.design_id,
      name: doc.name,
      description: doc.description,
      price: doc.price,
      number_of_rooms: doc.number_of_rooms,
      square_meters: doc.square_meters,
      category: doc.category,
      images: doc.images,
      createdBy: doc.createdBy,
      isLoanOffer: doc.isLoanOffer,
      maxLoanTerm: doc.maxLoanTerm,
      interestRate: doc.interestRate,
      interestRateType: doc.interestRateType,
      loanTermType: doc.loanTermType,
    };

    console.log("Validation data:", validationData);
    DesignPreSaveZodSchema.parse(validationData);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Zod validation errors:", error.errors);
      const errorMessage = error.errors.map((err) => err.message).join(", ");
      next(new Error(`Validation failed: ${errorMessage}`));
    } else {
      next(error as Error);
    }
  }
});

DesignSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate() as any;
    const docToUpdate = await this.model.findOne(this.getQuery());

    if (!docToUpdate) {
      return next(new Error("Document not found for update"));
    }

    const originalDoc = docToUpdate.toObject();
    const updatedDoc = { ...originalDoc, ...update.$set };

    console.log("Pre-update document:", updatedDoc);

    // Extract only the fields that should be validated
    const validationData = {
      design_id: updatedDoc.design_id,
      name: updatedDoc.name,
      description: updatedDoc.description,
      price: updatedDoc.price,
      number_of_rooms: updatedDoc.number_of_rooms,
      square_meters: updatedDoc.square_meters,
      category: updatedDoc.category,
      images: updatedDoc.images,
      createdBy: updatedDoc.createdBy,
      isLoanOffer: updatedDoc.isLoanOffer,
      maxLoanTerm: updatedDoc.maxLoanTerm,
      interestRate: updatedDoc.interestRate,
      interestRateType: updatedDoc.interestRateType,
      loanTermType: updatedDoc.loanTermType,
    };

    console.log("Validation data:", validationData);
    DesignPreSaveZodSchema.parse(validationData);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Zod validation errors:", error.errors);
      const errorMessage = error.errors.map((err) => err.message).join(", ");
      next(new Error(`Validation failed: ${errorMessage}`));
    } else {
      next(error as Error);
    }
  }
});

// Create or retrieve model
const DesignModel =
  mongoose.models?.Design ||
  mongoose.model<IDesignDocument>("Design", DesignSchema);

export default DesignModel;
