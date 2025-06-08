import mongoose, { Schema, Document } from "mongoose";
import { Design } from "@/types/design";

interface IDesign extends Document, Omit<Design, "_id"> {}

const DesignSchema: Schema = new Schema(
  {
    design_id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    number_of_rooms: { type: Number, required: true, min: 1 },
    square_meters: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    images: [{ type: String, required: true }],
    createdBy: { type: String, required: true, trim: true, default: "Admin" },
    isLoanOffer: { type: Boolean, required: true, default: false },
    maxLoanYears: {
      type: Number,
      min: 1,
      max: 30,
      required: false,
      default: null,
    },
    interestRate: { type: Number, min: 0, required: false, default: null },
  },
  { timestamps: true }
);

const DesignModel =
  mongoose.models?.Design || mongoose.model<IDesign>("Design", DesignSchema);

export default DesignModel;
