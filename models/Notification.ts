// models/Notification.ts
import mongoose, { Schema, Document } from "mongoose";

export interface InquiryDetails {
  name: string;
  email: string;
  phone?: string; // Made optional to match NotificationSheet
  message: string;
}

export interface Design {
  id: string;
  name: string;
  price?: number;
  square_meters?: number;
  images?: string[];
  isLoanOffer?: boolean;
  maxLoanYears?: number;
  interestRate?: number;
}

export interface NotificationDocument extends Document {
  userEmail: string;
  design: Design;
  designImage?: string;
  inquiryDetails: InquiryDetails;
  isGuest: boolean;
  isRead?: boolean;
  createdAt: Date;
  updatedAt?: Date; // Added for timestamps
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userEmail: { type: String, required: true },
    design: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number },
      square_meters: { type: Number },
      images: [{ type: String }],
      isLoanOffer: { type: Boolean },
      maxLoanYears: { type: Number },
      interestRate: { type: Number },
    },
    designImage: { type: String },
    inquiryDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String }, // Made optional
      message: { type: String, required: true },
    },
    isGuest: { type: Boolean, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true } // Enables createdAt and updatedAt
);

const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);

// Explicitly export the model
export default NotificationModel;
