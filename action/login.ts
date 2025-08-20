"use server";

import { z } from "zod";
import { scryptSync } from "crypto";
import { nanoid } from "nanoid";
import dbConnect from "../lib/db";
import User, { IUserDocument } from "../models/User";
import { setVerificationToken } from "../lib/redis";
import { sendEmail } from "../lib/nodemailer";
import { manageSession } from "./auth";
import { cookies } from "next/headers";

const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .trim()
    .toLowerCase(),
  password: z.string().min(1, "Password is required").optional(),
});

export async function loginUser(formData: FormData) {
  try {
    await dbConnect();

    const data = {
      email: formData.get("email")?.toString().trim().toLowerCase(),
      password: formData.get("password")?.toString(),
    };

    console.log("Login attempt with data:", {
      email: data.email,
      hasPassword: !!data.password,
    });

    const validatedData = loginSchema.safeParse(data);
    if (!validatedData.success) {
      console.log(
        "Zod validation errors:",
        validatedData.error.flatten().fieldErrors
      );
      return {
        success: false,
        error: validatedData.error.flatten().fieldErrors,
      };
    }

    const user = (await User.findOne({
      email: data.email,
    })) as IUserDocument | null;
    if (!user) {
      console.log("User not found for email:", data.email);
      return {
        success: false,
        error: "Email not registered",
      };
    }

    console.log("User found:", {
      email: user.email,
      verified: user.verified,
      role: user.role,
    });

    if (data.password) {
      const [salt, storedHash] = user.password.split(":");
      const hashedPassword = scryptSync(data.password, salt, 64).toString(
        "hex"
      );
      if (hashedPassword !== storedHash) {
        console.log("Password mismatch for email:", data.email);
        return {
          success: false,
          error: "Incorrect password",
        };
      }
    }

    if (!user.verified) {
      const token = nanoid(32);
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

      await setVerificationToken(token, {
        userId: user._id.toString(),
        email: user.email,
        user_id: user.user_id,
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
                          <h2 style="font-size: 20px; margin: 0 0 20px; color: #333333;">Complete Your GianConstruct Account Verification</h2>
                          <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                            Hello, ${user.firstName}! Your User ID is <strong>${user.user_id}</strong>. To log in, please verify your email address by clicking the button below.
                          </p>
                          <a href="${verificationUrl}" style="display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 16px; font-weight: bold; margin: 20px 0;">
                            Verify Your Email
                          </a>
                          <p style="font-size: 14px; line-height: 1.5; color: #666666; margin: 20px 0 0;">
                            This link will expire in 24 hours. If you did not attempt to log in, please disregard this email.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
                          <p style="margin: 0;">© 2025 GianConstruct. All rights reserved.</p>
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
        console.log("Verification email sent to:", user.email);
      } catch (emailError: any) {
        console.log("Email send error:", emailError.message);
        return {
          success: false,
          error: `Failed to send verification email: ${emailError.message}`,
        };
      }

      return {
        success: false,
        error: "Please verify your email. A verification link has been sent.",
      };
    }

    if (!data.password) {
      return {
        success: true,
        user: null,
      };
    }

    const { sessionId, sessionData } = await manageSession(
      user._id.toString(),
      user.email,
      user.user_id
    );

    // Set sessionId cookie
    const cookieStore = await cookies();
    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    console.log("Login successful, session created:", {
      sessionId,
      email: user.email,
    });

    return {
      success: true,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
      sessionId,
      instructions:
        "To clear your conversation history, click the book icon beneath any message that references a chat and select the chat from the menu to forget it. You can also disable the memory feature by going to the 'Data Controls' section of settings.",
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      error: `Login failed: ${error.message || "Unknown error"}`,
    };
  }
}
