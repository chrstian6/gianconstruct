// action/adminRegister.ts
"use server";

import { z } from "zod";
import dbConnect from "../lib/db";
import User from "../models/User";
import { sendEmail } from "../lib/nodemailer";

// Helper function to clean and format strings
function cleanString(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
    .replace(/\s+/g, " ") // Ensure single spaces again
    .trim();
}

// Helper function to clean email
function cleanEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Helper function to clean contact number
function cleanContactNumber(contactNo: string): string {
  return contactNo.trim().replace(/\s+/g, ""); // Remove all spaces
}

// Helper function to clean address
function cleanAddress(address: string): string {
  return address
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
    .trim();
}

const userSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .transform((val) => cleanString(val)),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .transform((val) => cleanString(val)),
    email: z.string().email("Invalid email address"),
    contactNo: z
      .string()
      .optional()
      .transform((val) => (val ? cleanContactNumber(val) : "")),
    address: z
      .string()
      .optional()
      .transform((val) => (val ? cleanAddress(val) : "")),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface ErrorResponse {
  firstName?: string[];
  lastName?: string[];
  email?: string[];
  contactNo?: string[];
  password?: string[];
  confirmPassword?: string[];
  general?: string[];
  [key: string]: string[] | undefined;
}

async function generateUserId(): Promise<string> {
  await dbConnect();

  // Find the highest existing user_id with GC- prefix
  const lastUser = await User.findOne(
    { user_id: { $regex: /^GC-\d+$/ } },
    { user_id: 1 },
    { sort: { user_id: -1 } }
  );

  let nextNumber = 1;

  if (lastUser && lastUser.user_id) {
    // Extract the number part from the last user_id (e.g., "GC-0042" -> 42)
    const lastNumber = parseInt(lastUser.user_id.split("-")[1]);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Format as GC-0001, GC-0002, etc. with leading zeros
  return `GC-${nextNumber.toString().padStart(4, "0")}`;
}

export async function adminRegisterUser(formData: FormData) {
  try {
    await dbConnect();

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const contactNo = formData.get("contactNo") as string;
    const address = formData.get("address") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const sendMagicLink = formData.get("sendMagicLink") === "true";

    // Clean input data
    const cleanedData = {
      firstName: cleanString(firstName),
      lastName: cleanString(lastName),
      email: cleanEmail(email),
      contactNo: contactNo ? cleanContactNumber(contactNo) : "",
      address: address ? cleanAddress(address) : "",
      password,
      confirmPassword,
    };

    // Validate input data
    const validatedData = userSchema.safeParse(cleanedData);
    if (!validatedData.success) {
      const errors = validatedData.error.flatten().fieldErrors;
      return {
        success: false,
        errors: errors as ErrorResponse,
      };
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: validatedData.data.email,
    });
    if (existingUser) {
      return {
        success: false,
        errors: {
          email: ["Email already registered"],
        } as ErrorResponse,
      };
    }

    // Check if contact number already exists (if provided)
    if (validatedData.data.contactNo) {
      const existingContact = await User.findOne({
        contactNo: validatedData.data.contactNo,
      });
      if (existingContact) {
        return {
          success: false,
          errors: {
            contactNo: ["Contact number already in use"],
          } as ErrorResponse,
        };
      }
    }

    // Generate user ID
    const user_id = await generateUserId();

    // Create new user
    const user = new User({
      user_id,
      firstName: validatedData.data.firstName,
      lastName: validatedData.data.lastName,
      email: validatedData.data.email,
      contactNo: validatedData.data.contactNo || undefined,
      address: validatedData.data.address || undefined,
      role: "user",
      verified: true, // Auto-verify for admin-created users
      timeStamp: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Hash password
    if (typeof user.hashPassword !== "function") {
      throw new Error("Password hashing method is unavailable");
    }
    await user.hashPassword(validatedData.data.password);

    await user.save();

    // Send welcome email with magic link if requested
    if (sendMagicLink) {
      try {
        // In a real implementation, you would generate a proper magic link
        // For now, we'll send a welcome email with instructions
        await sendEmail({
          to: user.email,
          subject: `Welcome to GianConstruct! Your Account Has Been Created`,
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to GianConstruct</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 40px 0;">
                    <table width="100%" max-width="500" style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                      <tr>
                        <td align="center" style="padding-bottom: 20px;">
                          <h2 style="color: #f97316; margin: 0;">Welcome to GianConstruct!</h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <p style="margin: 0 0 15px 0;">Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
                          <p style="margin: 0 0 15px 0;">Your account has been created by an administrator. Here are your login details:</p>

                          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
                            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${validatedData.data.password}</p>
                          </div>

                          <p style="margin: 15px 0; color: #dc2626; font-weight: bold;">
                            ⚠️ For security reasons, please change your password after your first login.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 20px;">
                          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/authentication-login"
                             style="background-color: #f97316; color: white; padding: 12px 30px;
                                    text-decoration: none; border-radius: 6px; display: inline-block;
                                    font-weight: bold;">
                            Login to Your Account
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="color: #666; font-size: 14px; margin: 0;">
                            If you have any questions, please contact our support team.
                          </p>
                          <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                            This is an automated message. Please do not reply to this email.
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
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the user creation if email fails
      }
    }

    return {
      success: true,
      user: {
        user_id: user.user_id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        verified: user.verified,
      },
    };
  } catch (error: any) {
    console.error("Admin user registration error:", error);
    return {
      success: false,
      errors: {
        general: [`Registration failed: ${error.message || "Unknown error"}`],
      } as ErrorResponse,
    };
  }
}
