// models/Notification.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface InquiryDetails {
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredDate?: string;
  preferredTime?: string;
  meetingType?: string;
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

export interface NotificationMetadata {
  inquiryId?: string;
  appointmentId?: string;
  originalDate?: string;
  originalTime?: string;
  reason?: string;
  notes?: string;
  newDate?: string;
  newTime?: string;
}

export interface NotificationDocument extends Document {
  userId?: string; // CHANGED: from Types.ObjectId to string
  userEmail: string;
  design: Design;
  designImage?: string;
  inquiryDetails: InquiryDetails;
  isGuest: boolean;
  isRead?: boolean;
  type: string;
  metadata?: NotificationMetadata;
  createdAt: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userId: {
      type: String, // CHANGED: from Schema.Types.ObjectId to String
      required: false, // Optional for guest users
      index: true,
    },
    userEmail: { type: String, required: true, index: true },
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
      phone: { type: String },
      message: { type: String, required: true },
      preferredDate: { type: String },
      preferredTime: { type: String },
      meetingType: { type: String },
    },
    isGuest: { type: Boolean, required: true },
    isRead: { type: Boolean, default: false },
    type: {
      type: String,
      required: true,
      default: "inquiry_submitted",
      enum: [
        "inquiry_submitted",
        "appointment_confirmed",
        "appointment_cancelled",
        "appointment_rescheduled",
        "appointment_completed",
      ],
    },
    metadata: {
      inquiryId: { type: String },
      appointmentId: { type: String },
      originalDate: { type: String },
      originalTime: { type: String },
      reason: { type: String },
      notes: { type: String },
      newDate: { type: String },
      newTime: { type: String },
    },
  },
  { timestamps: true }
);

// Add compound indexes for better query performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userEmail: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1, createdAt: -1 });

const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);

export default NotificationModel;
