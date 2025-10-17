"use server";

import { z } from "zod";
import { nanoid } from "nanoid";
import dbConnect from "../lib/db";
import User from "../models/User";
import {
  setVerificationToken,
  getVerificationToken,
  deleteVerificationToken,
} from "../lib/redis";
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

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const profileSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .transform((val) => cleanString(val)),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .transform((val) => cleanString(val)),
    address: z
      .string()
      .min(1, "Address is required")
      .transform((val) => cleanAddress(val)),
    contactNo: z
      .string()
      .regex(/^\d{10,11}$/, "Invalid contact number")
      .transform((val) => cleanContactNumber(val))
      .optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface ErrorResponse {
  email?: string[];
  contactNo?: string[];
  general?: string[];
  otp?: string[];
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

export async function initiateEmailSignup(formData: FormData) {
  try {
    await dbConnect();

    const email = formData.get("email") as string;
    const cleanedEmail = cleanEmail(email);

    const validatedData = emailSchema.safeParse({ email: cleanedEmail });
    if (!validatedData.success) {
      // Return first error found
      const errors = validatedData.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "Invalid input";
      return {
        success: false,
        errors: {
          general: [firstError],
        } as ErrorResponse,
      };
    }

    // Check if email already exists and is verified
    const existingUser = await User.findOne({ email: cleanedEmail });
    if (existingUser && existingUser.verified) {
      return {
        success: false,
        errors: {
          general: ["Email already registered and verified"],
        } as ErrorResponse,
      };
    }

    let user;
    let isNewUser = false;

    if (existingUser && !existingUser.verified) {
      user = existingUser;
    } else {
      const user_id = await generateUserId();
      user = new User({
        user_id,
        email: cleanedEmail,
        verified: false,
        role: "user",
        timeStamp: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await user.save();
      isNewUser = true;
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    try {
      await sendEmail({
        to: user.email,
        subject: "Your GianConstruct Verification Code",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table width="100%" max-width="400" style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <h2 style="color: #f97316; margin: 0;">GianConstruct</h2>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <h3 style="margin: 0 0 10px 0;">Your Verification Code</h3>
                        <p style="color: #666; margin: 0;">Enter this code to verify your email address</p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom: 30px;">
                        <div style="background: #f97316; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px 30px; border-radius: 6px; display: inline-block;">
                          ${otp}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                          This code will expire in 10 minutes. If you didn't request this, please ignore this email.
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
      if (isNewUser) {
        await User.findByIdAndDelete(user._id);
      }
      return {
        success: false,
        errors: {
          general: [`Failed to send OTP: ${emailError.message}`],
        } as ErrorResponse,
      };
    }

    // Store verification token in Redis
    const token = nanoid(32);
    await setVerificationToken(token, {
      userId: user._id.toString(),
      email: user.email,
      user_id: user.user_id,
      firstName: "",
    });

    return {
      success: true,
      token,
      userId: user._id.toString(),
      message: "OTP sent to your email",
    };
  } catch (error: any) {
    console.error("OTP signup error:", error);
    return {
      success: false,
      errors: {
        general: [`Signup failed: ${error.message || "Unknown error"}`],
      } as ErrorResponse,
    };
  }
}

export async function verifyOTP(token: string, otp: string) {
  try {
    await dbConnect();

    const verificationData = await getVerificationToken(token);
    if (!verificationData) {
      return {
        success: false,
        errors: {
          general: ["Invalid or expired verification session"],
        } as ErrorResponse,
      };
    }

    const user = await User.findById(verificationData.userId);
    if (!user) {
      return {
        success: false,
        errors: {
          general: ["User not found"],
        } as ErrorResponse,
      };
    }

    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return {
        success: false,
        errors: {
          general: ["Invalid or expired OTP"],
        } as ErrorResponse,
      };
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    await deleteVerificationToken(token);

    return {
      success: true,
      userId: user._id.toString(),
      userEmail: user.email,
      user_id: user.user_id,
      message: "Email verified successfully",
    };
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return {
      success: false,
      errors: {
        general: [`Verification failed: ${error.message || "Unknown error"}`],
      } as ErrorResponse,
    };
  }
}

export async function completeUserProfile(
  userId: string,
  profileData: {
    firstName: string;
    lastName: string;
    address: string;
    contactNo?: string;
    password: string;
  }
) {
  try {
    await dbConnect();

    // Clean the input data before validation
    const cleanedProfileData = {
      firstName: cleanString(profileData.firstName),
      lastName: cleanString(profileData.lastName),
      address: cleanAddress(profileData.address),
      contactNo: profileData.contactNo
        ? cleanContactNumber(profileData.contactNo)
        : undefined,
      password: profileData.password,
    };

    const validatedData = profileSchema.safeParse({
      ...cleanedProfileData,
      confirmPassword: cleanedProfileData.password,
    });

    if (!validatedData.success) {
      // Return first validation error found
      const errors = validatedData.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "Invalid input";
      return {
        success: false,
        errors: {
          general: [firstError],
        } as ErrorResponse,
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        errors: {
          general: ["User not found"],
        } as ErrorResponse,
      };
    }

    // Check for duplicate contact number with cleaned data
    if (validatedData.data.contactNo) {
      const existingContact = await User.findOne({
        contactNo: validatedData.data.contactNo,
        _id: { $ne: userId },
      });
      if (existingContact) {
        return {
          success: false,
          errors: {
            general: ["Contact number already in use"],
          } as ErrorResponse,
        };
      }
    }

    // Update user with cleaned and validated data
    user.firstName = validatedData.data.firstName;
    user.lastName = validatedData.data.lastName;
    user.address = validatedData.data.address;
    user.contactNo = validatedData.data.contactNo;

    // Hash password with error handling
    if (typeof user.hashPassword !== "function") {
      console.error("hashPassword is not a function on user instance");
      throw new Error("Password hashing method is unavailable");
    }
    await user.hashPassword(validatedData.data.password);

    user.verified = true;
    user.updatedAt = new Date();
    await user.save();

    return {
      success: true,
      user: {
        user_id: user.user_id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  } catch (error: any) {
    console.error("Profile completion error:", error);
    return {
      success: false,
      errors: {
        general: [
          `Profile completion failed: ${error.message || "Unknown error"}`,
        ],
      } as ErrorResponse,
    };
  }
}

// Additional utility function for cleaning existing user data (optional)
export async function cleanExistingUserData() {
  try {
    await dbConnect();

    const users = await User.find({});
    let cleanedCount = 0;

    for (const user of users) {
      let needsUpdate = false;

      if (user.firstName) {
        const cleanedFirstName = cleanString(user.firstName);
        if (cleanedFirstName !== user.firstName) {
          user.firstName = cleanedFirstName;
          needsUpdate = true;
        }
      }

      if (user.lastName) {
        const cleanedLastName = cleanString(user.lastName);
        if (cleanedLastName !== user.lastName) {
          user.lastName = cleanedLastName;
          needsUpdate = true;
        }
      }

      if (user.address) {
        const cleanedAddress = cleanAddress(user.address);
        if (cleanedAddress !== user.address) {
          user.address = cleanedAddress;
          needsUpdate = true;
        }
      }

      if (user.contactNo) {
        const cleanedContactNo = cleanContactNumber(user.contactNo);
        if (cleanedContactNo !== user.contactNo) {
          user.contactNo = cleanedContactNo;
          needsUpdate = true;
        }
      }

      if (user.email) {
        const cleanedEmail = cleanEmail(user.email);
        if (cleanedEmail !== user.email) {
          user.email = cleanedEmail;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await user.save();
        cleanedCount++;
      }
    }

    return {
      success: true,
      message: `Cleaned data for ${cleanedCount} users`,
      cleanedCount,
    };
  } catch (error: any) {
    console.error("Error cleaning existing user data:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
