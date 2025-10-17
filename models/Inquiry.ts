// models/Inquiry.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface Inquiry {
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredDate: string;
  preferredTime: string;
  meetingType: "phone" | "onsite" | "video";
  design: {
    id: string;
    name: string;
    price?: number;
    square_meters?: number;
  };
  submittedAt: string;
  status: "pending" | "confirmed" | "cancelled" | "rescheduled" | "completed";
  notes?: string;
  cancellationReason?: string;
  rescheduleNotes?: string;
  user_id?: string; // Only use user_id to match your User model
  userType: "guest" | "registered";
  userRole: string;
}

export interface InquiryDocument extends Inquiry, Document {
  _id: Types.ObjectId;
}

const InquirySchema: Schema<InquiryDocument> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  preferredDate: { type: String, required: true },
  preferredTime: { type: String, required: true },
  meetingType: {
    type: String,
    required: true,
    enum: ["phone", "onsite", "video"],
  },
  design: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: false },
    square_meters: { type: Number, required: false },
  },
  submittedAt: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["pending", "confirmed", "cancelled", "rescheduled", "completed"],
    default: "pending",
  },
  notes: { type: String, required: false },
  cancellationReason: { type: String, required: false },
  rescheduleNotes: { type: String, required: false },
  user_id: { type: String, required: false }, // Only user_id to match User model
  userType: {
    type: String,
    required: true,
    enum: ["guest", "registered"],
    default: "guest",
  },
  userRole: { type: String, required: true, default: "guest" },
});

export const Inquiry =
  (mongoose.models.Inquiry as Model<InquiryDocument>) ||
  mongoose.model<InquiryDocument>("Inquiry", InquirySchema);
