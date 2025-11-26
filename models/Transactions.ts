import mongoose, { Document, Schema, Model } from "mongoose";

export interface ITransaction extends Document {
  transaction_id: string;
  project_id: string;
  user_id: string;
  amount: number;
  total_amount: number;
  type: "downpayment" | "partial_payment" | "balance" | "full";
  status: "pending" | "paid" | "expired" | "cancelled";
  due_date: Date;
  payment_deadline: Date;
  created_at: Date;
  updated_at: Date;
  paid_at?: Date;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
}

// Define the static methods interface
interface TransactionModel extends Model<ITransaction> {
  generateTransactionId(): Promise<string>;
}

const TransactionSchema: Schema = new Schema({
  transaction_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  project_id: {
    type: String,
    required: true,
    index: true,
  },
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    enum: ["downpayment", "partial_payment", "balance", "full"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "paid", "expired", "cancelled"],
    default: "pending",
  },
  due_date: {
    type: Date,
    required: true,
  },
  payment_deadline: {
    type: Date,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  paid_at: {
    type: Date,
  },
  payment_method: {
    type: String,
  },
  reference_number: {
    type: String,
  },
  notes: {
    type: String,
  },
});

// Update the updated_at field before saving
TransactionSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Static method to generate transaction ID
TransactionSchema.statics.generateTransactionId =
  async function (): Promise<string> {
    const prefix = "TXN";
    const count = await this.countDocuments();
    const sequential = (count + 1).toString().padStart(6, "0");
    return `${prefix}${sequential}`;
  };

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction, TransactionModel>(
    "Transaction",
    TransactionSchema
  );
