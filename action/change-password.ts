// action/change-password.ts
"use server";

import { z } from "zod";
import dbConnect from "../lib/db";
import User from "../models/User";
import { sendEmail } from "../lib/nodemailer";
import { nanoid } from "nanoid";
import {
  setPasswordChangeVerification,
  getPasswordChangeVerification,
  deleteVerificationToken,
} from "../lib/redis";

// Helper function to clean strings
function cleanString(str: string): string {
  return str.trim();
}

// Password change schema
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface ErrorResponse {
  currentPassword?: string[];
  newPassword?: string[];
  confirmPassword?: string[];
  general?: string[];
  [key: string]: string[] | undefined;
}

interface DeviceInfo {
  ip: string;
  userAgent: string;
  location?: string;
  timestamp: string;
}

export async function initiatePasswordChange(
  userId: string,
  formData: FormData,
  deviceInfo: DeviceInfo
) {
  try {
    await dbConnect();

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate input
    const validatedData = passwordChangeSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validatedData.success) {
      const errors = validatedData.error.flatten().fieldErrors;
      return {
        success: false,
        errors: errors as ErrorResponse,
      };
    }

    // Get user by user_id (not _id) - FIXED HERE
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return {
        success: false,
        errors: {
          general: ["User not found"],
        } as ErrorResponse,
      };
    }

    // Verify current password
    if (typeof user.comparePassword !== "function") {
      throw new Error("Password comparison method is unavailable");
    }

    // Remove the type check and directly call the method
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        errors: {
          currentPassword: ["Current password is incorrect"],
        } as ErrorResponse,
      };
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return {
        success: false,
        errors: {
          newPassword: ["New password must be different from current password"],
        } as ErrorResponse,
      };
    }

    // Generate verification token
    const token = nanoid(32);
    const tokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Get location information
    let location = "Unknown location";
    try {
      if (deviceInfo.ip && deviceInfo.ip !== "unknown") {
        const response = await fetch(`http://ip-api.com/json/${deviceInfo.ip}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "success") {
            location = `${data.city}, ${data.regionName}, ${data.country}`;
          }
        }
      }
    } catch (locationError) {
      console.error("Failed to fetch location:", locationError);
      location = "Location unavailable";
    }

    // Store password change verification data in Redis
    await setPasswordChangeVerification(token, {
      userId: user._id.toString(), // Store the MongoDB _id for verification
      user_id: user.user_id, // Store the custom user_id
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      newPassword: newPassword,
      deviceInfo: {
        ...deviceInfo,
        location: location,
      },
      tokenExpires: tokenExpires.getTime(),
    });

    // Send magic link email
    const magicLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/verify-password-change?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Confirm Your Password Change - GianConstruct",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirm Password Change</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table width="100%" max-width="500" style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <h2 style="color: #f97316; margin: 0;">Confirm Password Change</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <p style="margin: 0 0 15px 0;">Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
                        <p style="margin: 0 0 15px 0;">We received a request to change your password. This request was made from:</p>

                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
                          <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceInfo.userAgent}</p>
                          <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
                          <p style="margin: 5px 0;"><strong>IP Address:</strong> ${deviceInfo.ip}</p>
                          <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(deviceInfo.timestamp).toLocaleString()}</p>
                        </div>

                        <p style="margin: 15px 0;">
                          If you initiated this request, please click the button below to confirm the password change.
                          This link will expire in 1 hour for security reasons.
                        </p>

                        <p style="margin: 15px 0; color: #dc2626; font-weight: bold;">
                          ⚠️ If you didn't request this change, please ignore this email and contact support immediately.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <a href="${magicLink}"
                           style="background-color: #f97316; color: white; padding: 12px 30px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;
                                  font-weight: bold; font-size: 16px;">
                          Confirm Password Change
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p style="color: #666; font-size: 14px; margin: 0;">
                          Or copy and paste this link in your browser:
                        </p>
                        <p style="color: #f97316; font-size: 12px; margin: 5px 0; word-break: break-all;">
                          ${magicLink}
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
      console.error("Failed to send password change email:", emailError);
      return {
        success: false,
        errors: {
          general: [`Failed to send verification email: ${emailError.message}`],
        } as ErrorResponse,
      };
    }

    return {
      success: true,
      message:
        "Verification email sent. Please check your inbox to confirm the password change.",
    };
  } catch (error: any) {
    console.error("Password change initiation error:", error);
    return {
      success: false,
      errors: {
        general: [
          `Password change failed: ${error.message || "Unknown error"}`,
        ],
      } as ErrorResponse,
    };
  }
}

export async function verifyPasswordChange(token: string) {
  try {
    await dbConnect();

    const verificationData = await getPasswordChangeVerification(token);
    if (!verificationData) {
      return {
        success: false,
        error: "Invalid or expired verification link",
      };
    }

    // Check if token is expired
    if (verificationData.tokenExpires < Date.now()) {
      await deleteVerificationToken(token);
      return {
        success: false,
        error: "Verification link has expired",
      };
    }

    // Find user by MongoDB _id (stored during initiation) - FIXED HERE
    const user = await User.findById(verificationData.userId);
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Update password
    if (typeof user.hashPassword !== "function") {
      throw new Error("Password hashing method is unavailable");
    }

    await user.hashPassword(verificationData.newPassword);
    user.updatedAt = new Date();
    await user.save();

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: "Password Changed Successfully - GianConstruct",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table width="100%" max-width="500" style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <h2 style="color: #22c55e; margin: 0;">Password Changed Successfully</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <p style="margin: 0 0 15px 0;">Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
                        <p style="margin: 0 0 15px 0;">Your password has been successfully changed.</p>

                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 15px 0;">
                          <p style="margin: 5px 0; color: #166534;">
                            <strong>✓ Password updated successfully</strong>
                          </p>
                          <p style="margin: 5px 0; color: #166534;">
                            Time: ${new Date().toLocaleString()}
                          </p>
                        </div>

                        <p style="margin: 15px 0;">
                          If you did not make this change, please contact our support team immediately.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p style="color: #666; font-size: 14px; margin: 0;">
                          For security reasons, we recommend:
                        </p>
                        <ul style="color: #666; font-size: 14px; margin: 10px 0; padding-left: 20px;">
                          <li>Using a strong, unique password</li>
                          <li>Enabling two-factor authentication</li>
                          <li>Regularly updating your password</li>
                        </ul>
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
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the password change if confirmation email fails
    }

    // Clean up the token
    await deleteVerificationToken(token);

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error: any) {
    console.error("Password change verification error:", error);
    return {
      success: false,
      error: `Password change failed: ${error.message || "Unknown error"}`,
    };
  }
}
