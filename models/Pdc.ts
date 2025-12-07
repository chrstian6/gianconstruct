// models/Pdc.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import dbConnect from "@/lib/db";

export interface IPDCItemReference {
  product_id: string;
  quantity: number;
  unitCost: number;
  totalCapital: number;
}

export interface IPDC extends Document {
  checkNumber: string;
  checkDate: Date;
  supplier: string;
  totalAmount: number;
  itemCount: number;
  payee: string;
  amountInWords: string;
  items: IPDCItemReference[];
  status: "pending" | "issued" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  issuedAt?: Date;
  cancelledAt?: Date;
}

// Extended interface for JSON representation
interface IPDCJSON extends Omit<IPDC, "_id" | "__v"> {
  pdc_id: string;
}

const PDCItemReferenceSchema = new Schema<IPDCItemReference>(
  {
    product_id: {
      type: String,
      required: true,
      ref: "Inventory", // Reference to Inventory collection
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCapital: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const PDCSchema = new Schema<IPDC>(
  {
    checkNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    checkDate: {
      type: Date,
      required: true,
      index: true,
    },
    supplier: {
      type: String,
      required: true,
      index: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    itemCount: {
      type: Number,
      required: true,
      min: 0,
    },
    payee: {
      type: String,
      required: true,
    },
    amountInWords: {
      type: String,
      required: true,
    },
    items: [PDCItemReferenceSchema],
    status: {
      type: String,
      enum: ["pending", "issued", "cancelled"],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
    },
    issuedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        // Create a new object to avoid modifying the original ret
        const result = { ...ret } as any;

        // Add pdc_id field
        result.pdc_id = result._id.toString();

        // Remove fields we don't want in the JSON
        delete result._id;
        delete result.__v;

        return result;
      },
    },
  }
);

// Compound indexes for better query performance
PDCSchema.index({ status: 1, checkDate: -1 });
PDCSchema.index({ supplier: 1, checkDate: -1 });
PDCSchema.index({ createdAt: -1 });

// Static methods
PDCSchema.statics.findByStatus = function (status: IPDC["status"]) {
  return this.find({ status }).sort({ checkDate: -1, createdAt: -1 });
};

PDCSchema.statics.findBySupplier = function (supplier: string) {
  return this.find({ supplier }).sort({ checkDate: -1, createdAt: -1 });
};

PDCSchema.statics.findByDateRange = function (startDate: Date, endDate: Date) {
  return this.find({
    checkDate: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ checkDate: -1, createdAt: -1 });
};

PDCSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);

  const result = {
    total: 0,
    pending: 0,
    issued: 0,
    cancelled: 0,
    totalAmount: 0,
    pendingAmount: 0,
    issuedAmount: 0,
    cancelledAmount: 0,
  };

  stats.forEach((stat) => {
    result.total += stat.count;
    result.totalAmount += stat.totalAmount;

    switch (stat._id) {
      case "pending":
        result.pending = stat.count;
        result.pendingAmount = stat.totalAmount;
        break;
      case "issued":
        result.issued = stat.count;
        result.issuedAmount = stat.totalAmount;
        break;
      case "cancelled":
        result.cancelled = stat.count;
        result.cancelledAmount = stat.totalAmount;
        break;
    }
  });

  return result;
};

export interface IPDCModel extends Model<IPDC> {
  findByStatus(status: IPDC["status"]): Promise<IPDC[]>;
  findBySupplier(supplier: string): Promise<IPDC[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<IPDC[]>;
  getStats(): Promise<{
    total: number;
    pending: number;
    issued: number;
    cancelled: number;
    totalAmount: number;
    pendingAmount: number;
    issuedAmount: number;
    cancelledAmount: number;
  }>;
}

// Check if model exists before creating to prevent OverwriteModelError
const PDC =
  (mongoose.models.PDC as IPDCModel) ||
  mongoose.model<IPDC, IPDCModel>("PDC", PDCSchema);

export default PDC;
