// models/Timeslot.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface Timeslot {
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  isAvailable: boolean;
  inquiryId?: Types.ObjectId; // Reference to booked inquiry
  meetingType?: "phone" | "onsite" | "video";
  createdAt: string;
  updatedAt: string;
}

export interface TimeslotDocument extends Timeslot, Document {
  _id: Types.ObjectId;
}

const TimeslotSchema: Schema<TimeslotDocument> = new Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    isAvailable: { type: Boolean, required: true, default: true },
    inquiryId: { type: Schema.Types.ObjectId, ref: "Inquiry" },
    meetingType: { type: String, enum: ["phone", "onsite", "video"] },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    // Create compound index to prevent duplicate timeslots for same date/time
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Compound index to ensure unique timeslots per date
TimeslotSchema.index({ date: 1, time: 1 }, { unique: true });

export const Timeslot =
  (mongoose.models.Timeslot as Model<TimeslotDocument>) ||
  mongoose.model<TimeslotDocument>("Timeslot", TimeslotSchema);
