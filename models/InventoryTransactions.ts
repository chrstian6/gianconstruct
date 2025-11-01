// models/InventoryTransaction.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInventoryTransactionDoc extends Document {
  transaction_id: string;
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  items: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category?: string;
  }>;
  paymentMethod: "cash" | "card" | "bank_transfer" | "check";
  paymentType: "full" | "downpayment" | "monthly";
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  taxPercentage: number;
  totalAmount: number;
  amountPaid: number;
  change: number;
  transactionDate: Date;
  notes?: string;
  status: "completed" | "pending" | "failed" | "void" | "voided"; // Add "void" here
  createdAt: Date;
  updatedAt: Date;
}

const InventoryTransactionSchema: Schema<IInventoryTransactionDoc> =
  new Schema<IInventoryTransactionDoc>(
    {
      transaction_id: {
        type: String,
        unique: true,
        required: true,
        index: true,
      },
      referenceNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      clientName: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      clientEmail: {
        type: String,
        trim: true,
        lowercase: true,
      },
      clientPhone: {
        type: String,
        trim: true,
      },
      clientAddress: {
        type: String,
        trim: true,
      },
      items: [
        {
          product_id: {
            type: String,
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
          },
          unitPrice: {
            type: Number,
            required: true,
            min: 0,
          },
          totalPrice: {
            type: Number,
            required: true,
            min: 0,
          },
          category: String,
        },
      ],
      paymentMethod: {
        type: String,
        enum: ["cash", "card", "bank_transfer", "check"],
        required: true,
      },
      paymentType: {
        type: String,
        enum: ["full", "downpayment", "monthly"],
        required: true,
      },
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      taxAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      taxPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      amountPaid: {
        type: Number,
        required: true,
        min: 0,
      },
      change: {
        type: Number,
        required: true,
        min: 0,
      },
      transactionDate: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
      },
      notes: String,
      status: {
        type: String,
        enum: ["completed", "pending", "failed", "void"], // Add "void" here
        default: "completed",
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

// Virtual for total items in transaction
InventoryTransactionSchema.virtual("itemCount").get(function (
  this: IInventoryTransactionDoc
) {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for profit calculation
InventoryTransactionSchema.virtual("profit").get(function (
  this: IInventoryTransactionDoc
) {
  return this.totalAmount - this.subtotal;
});

// Index for common queries
InventoryTransactionSchema.index({ clientName: 1, transactionDate: -1 });
InventoryTransactionSchema.index({ status: 1, transactionDate: -1 });
InventoryTransactionSchema.index({ paymentMethod: 1, transactionDate: -1 });

// Ensure virtuals are included in toJSON output
InventoryTransactionSchema.set("toJSON", { virtuals: true });

// Avoid model overwrite errors in Next.js hot reload
const InventoryTransaction: Model<IInventoryTransactionDoc> =
  mongoose.models.InventoryTransaction ||
  mongoose.model<IInventoryTransactionDoc>(
    "InventoryTransaction",
    InventoryTransactionSchema
  );

export default InventoryTransaction;
