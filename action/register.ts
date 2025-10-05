"use server";

import { z } from "zod";
import { nanoid, customAlphabet } from "nanoid";
import dbConnect from "../lib/db";
import User, { IUserDocument } from "../models/User";
import { setVerificationToken, deleteVerificationToken } from "../lib/redis";
import { sendEmail } from "../lib/nodemailer";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    address: z.string().min(1, "Address is required"),
    contactNo: z
      .string()
      .regex(/^\d{10,11}$/, "Invalid contact number")
      .optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Updated alphabet for the new format: lowercase letters and numbers
const generateUserId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  5
);

async function generateUniqueUserId(): Promise<string> {
  let user_id: string;
  let existingUser: IUserDocument | null;

  do {
    // Generate 5 characters for the ID part (e.g., "m95xu")
    const rawId = generateUserId();

    // Format as: first 3 characters + "-" + last 2 characters (e.g., "m95-xu")
    user_id = `${rawId.slice(0, 3)}-${rawId.slice(3)}`;

    existingUser = await User.findOne({ user_id });
  } while (existingUser);

  return user_id;
}

export async function registerUser(formData: FormData) {
  try {
    await dbConnect();

    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      address: formData.get("address") as string,
      contactNo: formData.get("contactNo") as string,
      email: formData.get("email") as string,
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
      address: data.address,
      contactNo: data.contactNo,
      email: data.email,
      password: "",
      role: "user",
      verified: false,
      timeStamp: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as IUserDocument;

    // Hash password with error handling
    if (typeof user.hashPassword !== "function") {
      console.error("hashPassword is not a function on user instance");
      throw new Error("Password hashing method is unavailable");
    }
    await user.hashPassword(data.password);

    await user.save();
    console.log(
      `User saved to gianconstruct.users: ${user.email} with user_id: ${user.user_id}`
    );

    const token = nanoid(32);
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

    await setVerificationToken(token, {
      userId: user._id.toString(),
      email: user.email,
      user_id: user.user_id,
      firstName: user.firstName,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify Your GianConstruct Account",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your GianConstruct Account</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background-color: #1a73e8; padding: 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">GianConstruct</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px; text-align: center;">
                        <h2 style="font-size: 20px; margin: 0 0 20px; color: #333333;">Welcome to GianConstruct, ${data.firstName}!</h2>
                        <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                          Thank you for registering with GianConstruct. Your User ID is <strong>${user.user_id}</strong>. To complete your account setup, please verify your email address by clicking the button below.
                        </p>
                        <a href="${verificationUrl}" style="display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 16px; font-weight: bold; margin: 20px 0;">
                          Verify Your Email
                        </a>
                        <p style="font-size: 14px; line-height: 1.5; color: #666666; margin: 20px 0 0;">
                          This link will expire in 24 hours. If you did not create an account with GianConstruct, please disregard this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
                        <p style="margin: 0;">&copy; 2025 GianConstruct. All rights reserved.</p>
                        <p style="margin: 5px 0 0;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color: #1a73e8; text-decoration: none;">Privacy Policy</a> |
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" style="color: #1a73e8; text-decoration: none;">Terms of Service</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
    } catch (emailError: any) {
      await User.deleteOne({ _id: user._id });
      await deleteVerificationToken(token);
      return {
        success: false,
        errors: {
          general: `Failed to send verification email: ${emailError.message}`,
        },
      };
    }

    return {
      success: true,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    return {
      success: false,
      errors: {
        general: `Registration failed: ${error.message || "Unknown error"}`,
      },
    };
  }
}
