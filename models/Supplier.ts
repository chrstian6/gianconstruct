import mongoose, { Schema, Document } from "mongoose";

export interface ISupplierDocument extends Document {
  supplier_id: string;
  companyName: string;
  contactPerson: string;
  contact: string;
  email?: string;
  location: string;
  status: "active" | "inactive" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema: Schema = new Schema(
  {
    supplier_id: {
      type: String,
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^\d{11}$/.test(v);
        },
        message: "Contact must be exactly 11 digits",
      },
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Clear existing pre-save hooks to prevent duplicates
SupplierSchema.pre("save", { document: true, query: false }, function (next) {
  if (this.isNew) {
    console.log("Running pre-save middleware for supplier_id generation"); // Debugging
    // Use the schema's model to ensure consistent model reference
    const SupplierModel = mongoose.model<ISupplierDocument>(
      "Supplier",
      SupplierSchema
    );
    SupplierModel.findOne()
      .sort({ supplier_id: -1 })
      .lean()
      .exec()
      .then((lastSupplier) => {
        let nextNumber = 1;

        if (lastSupplier && lastSupplier.supplier_id) {
          console.log("Last supplier found:", lastSupplier.supplier_id); // Debugging
          const match = lastSupplier.supplier_id.match(/^SUP-(\d+)$/);
          if (match && match[1]) {
            const lastNumber = parseInt(match[1], 10);
            if (!isNaN(lastNumber)) {
              nextNumber = lastNumber + 1;
            }
          } else {
            console.warn(
              "Invalid supplier_id format:",
              lastSupplier.supplier_id
            );
          }
        } else {
          console.log("No previous suppliers found, starting with SUP-000001");
        }

        this.supplier_id = `SUP-${nextNumber.toString().padStart(6, "0")}`;
        console.log("Generated supplier_id:", this.supplier_id); // Debugging
        next();
      })
      .catch((error) => {
        console.error("Error in pre-save middleware:", error);
        next(error);
      });
  } else {
    next();
  }
});

// Ensure model is only registered once
const Supplier =
  mongoose.models.Supplier ||
  mongoose.model<ISupplierDocument>("Supplier", SupplierSchema);
export default Supplier;
