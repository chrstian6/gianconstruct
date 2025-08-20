// action/adminRegister.ts
"use server";

import { z } from "zod";
import dbConnect from "../lib/db";
import User, { IUserDocument } from "../models/User";
import { scryptSync, randomBytes } from "crypto";
import { nanoid, customAlphabet } from "nanoid";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    contactNo: z
      .string()
      .regex(/^\d{10,11}$/, "Invalid contact number")
      .optional(),
    address: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const generateUserId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  6
);

async function generateUniqueUserId(): Promise<string> {
  let user_id: string;
  let existingUser: IUserDocument | null;
  do {
    const rawId = generateUserId();
    user_id = `${rawId.slice(0, 3)}-${rawId.slice(3)}`;
    existingUser = await User.findOne({ user_id });
  } while (existingUser);
  return user_id;
}

export async function adminRegisterUser(formData: FormData) {
  try {
    await dbConnect();

    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      contactNo: formData.get("contactNo") as string,
      address: formData.get("address") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const validatedData = registerSchema.safeParse(data);
    if (!validatedData.success) {
      return {
        success: false,
        errors: validatedData.error.flatten().fieldErrors,
      };
    }

    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { contactNo: data.contactNo }],
    });
    if (existingUser) {
      return {
        success: false,
        errors: {
          email:
            existingUser.email === data.email
              ? "Email already in use"
              : undefined,
          contactNo:
            existingUser.contactNo === data.contactNo
              ? "Contact number already in use"
              : undefined,
        },
      };
    }

    const user_id = await generateUniqueUserId();

    const user = new User({
      user_id,
      firstName: data.firstName,
      lastName: data.lastName,
      address: data.address || "", // Optional, defaults to empty string
      contactNo: data.contactNo,
      email: data.email,
      password: "",
      role: "user", // Admin can set role if needed, default to "user"
      verified: true, // Bypassing email verification
    }) as IUserDocument;

    // Hash password
    const salt = randomBytes(16).toString("hex");
    const hashedPassword = scryptSync(data.password, salt, 64).toString("hex");
    user.password = `${salt}:${hashedPassword}`;

    await user.save();
    console.log(
      `User saved by admin to gianconstruct.users: ${user.email} with user_id: ${user.user_id}`
    );

    return {
      success: true,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: any) {
    console.error("Admin registration error:", error);
    return {
      success: false,
      errors: {
        general: `Registration failed: ${error.message || "Unknown error"}`,
      },
    };
  }
}
