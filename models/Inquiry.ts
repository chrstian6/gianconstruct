// models/Inquiry.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface Inquiry {
  name: string;
  email: string;
  phone: string;
  message: string;
  design: {
    id: string;
    name: string;
  };
  submittedAt: string;
  status: string;
}

export interface InquiryDocument extends Inquiry, Document {
  _id: Types.ObjectId; // Explicitly type _id as ObjectId
}

const InquirySchema: Schema<InquiryDocument> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  design: {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  submittedAt: { type: String, required: true },
  status: { type: String, required: true, default: "pending" },
});

export const Inquiry =
  (mongoose.models.Inquiry as Model<InquiryDocument>) ||
  mongoose.model<InquiryDocument>("Inquiry", InquirySchema);
