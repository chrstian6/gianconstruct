// models/User.ts
import mongoose, { Schema, Document } from "mongoose";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

// Define valid roles - ADDED CASHIER
export const USER_ROLES = {
  USER: "user",
  PROJECT_MANAGER: "project_manager",
  CASHIER: "cashier", // NEW ROLE
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Define the methods interface
export interface IUserMethods {
  hashPassword(password: string): Promise<void>;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Combine Document and Methods interfaces
export interface IUserDocument extends Document, IUserMethods {
  user_id: string;
  firstName: string;
  lastName: string;
  address: string;
  contactNo?: string;
  email: string;
  password: string;
  role: UserRole;
  verified: boolean;
  avatar?: string;
  otp?: string;
  otpExpires?: Date;
  // Add Google-specific fields
  googleId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
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
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    verified: { type: Boolean, default: false },
    avatar: { type: String },
    otp: { type: String },
    otpExpires: { type: Date },
    // Add Google-specific fields
    googleId: { type: String, unique: true, sparse: true },
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String },
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

userSchema.method(
  "comparePassword",
  async function (candidatePassword: string) {
    try {
      const [salt, hashedPassword] = this.password.split(":");

      if (!salt || !hashedPassword) {
        return false;
      }

      const candidateHash = scryptSync(candidatePassword, salt, 64);
      const storedHash = Buffer.from(hashedPassword, "hex");

      return timingSafeEqual(candidateHash, storedHash);
    } catch (error) {
      console.error("Password comparison error:", error);
      return false;
    }
  }
);

// Use Model type with the methods
type UserModel = mongoose.Model<IUserDocument, {}, IUserMethods>;

const User =
  (mongoose.models.User as UserModel) ||
  mongoose.model<IUserDocument, UserModel>("User", userSchema);

export default User;
