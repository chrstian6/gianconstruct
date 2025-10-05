// models/User.ts
import mongoose, { Schema, Document } from "mongoose";
import { scryptSync, randomBytes } from "crypto";

export interface IUserDocument extends Document {
  _id: string;
  user_id: string;
  firstName: string;
  lastName: string;
  address: string;
  contactNo?: string;
  email: string;
  password: string;
  role: string;
  verified: boolean;
  otp?: string;
  otpExpires?: Date;
  hashPassword: (password: string) => Promise<void>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    user_id: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    address: { type: String },
    contactNo: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, default: "user" },
    verified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.method("hashPassword", async function (password: string) {
  try {
    const salt = randomBytes(16).toString("hex");
    const hashedPassword = scryptSync(password, salt, 64).toString("hex");
    this.password = `${salt}:${hashedPassword}`;
  } catch (error: any) {
    console.error("Password hashing error:", error);
    throw new Error(`Password hashing failed: ${error.message}`);
  }
});

const User =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
export default User;
