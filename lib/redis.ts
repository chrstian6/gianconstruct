// lib/redis.ts - Update the interfaces
"use server";

import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";

interface SessionData {
  userId: string;
  avatar: string;
  email: string;
  user_id: string;
  firstName: string;
  lastName: string;
  contactNo: string;
  role: string;
  createdAt: string;
}

interface VerificationData {
  userId: string;
  avatar: string;
  email: string;
  user_id: string;
  firstName: string;
  lastName: string;
  contactNo: string;
  otpExpires?: number;
}

// Add new interface for password change verification
interface PasswordChangeVerificationData {
  userId: string;
  email: string;
  user_id: string;
  firstName: string;
  lastName: string;
  newPassword: string;
  deviceInfo: {
    ip: string;
    userAgent: string;
    location?: string;
    timestamp: string;
  };
  tokenExpires: number;
  type: "password-change";
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

export async function verifySession(): Promise<SessionData | null> {
  try {
    const sessionId = (await cookies()).get("sessionId")?.value;
    if (!sessionId) {
      console.log("No sessionId cookie found");
      return null;
    }

    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      console.log("No session found for sessionId:", sessionId);
      (await cookies()).delete("sessionId");
      return null;
    }

    if (typeof sessionData === "string") {
      return JSON.parse(sessionData) as SessionData;
    }
    return sessionData as SessionData;
  } catch (error) {
    console.error("Error verifying session in Upstash Redis:", error);
    return null;
  }
}

export async function getSession(
  sessionId: string
): Promise<SessionData | null> {
  try {
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) return null;
    if (typeof sessionData === "string") {
      return JSON.parse(sessionData) as SessionData;
    }
    return sessionData as SessionData;
  } catch (error) {
    console.error("Error getting session from Upstash Redis:", error);
    throw new Error("Failed to get session");
  }
}

export async function setSession(
  sessionId: string,
  data: SessionData,
  ttl: number = 24 * 60 * 60
): Promise<void> {
  try {
    await redis.set(`session:${sessionId}`, data, { ex: ttl });
  } catch (error) {
    console.error("Error setting session in Upstash Redis:", error);
    throw new Error("Failed to set session");
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await redis.del(`session:${sessionId}`);
  } catch (error) {
    console.error("Error deleting session from Upstash Redis:", error);
    throw new Error("Failed to delete session");
  }
}

export async function setVerificationToken(
  token: string,
  data: VerificationData | PasswordChangeVerificationData,
  ttl: number = 24 * 60 * 60
): Promise<void> {
  try {
    await redis.set(`verify:${token}`, JSON.stringify(data), { ex: ttl });
  } catch (error) {
    console.error("Error setting verification token in Upstash Redis:", error);
    throw new Error("Failed to set verification token");
  }
}

export async function getVerificationToken(
  token: string
): Promise<VerificationData | PasswordChangeVerificationData | null> {
  try {
    const verificationData = await redis.get(`verify:${token}`);
    if (!verificationData) return null;

    if (typeof verificationData === "string") {
      const parsedData = JSON.parse(verificationData);

      // Determine the type based on the data structure
      if (parsedData.type === "password-change") {
        return parsedData as PasswordChangeVerificationData;
      } else {
        return parsedData as VerificationData;
      }
    }

    // Handle non-string case (shouldn't happen with our implementation)
    const data = verificationData as any;
    if (data.type === "password-change") {
      return data as PasswordChangeVerificationData;
    } else {
      return data as VerificationData;
    }
  } catch (error) {
    console.error(
      "Error getting verification token from Upstash Redis:",
      error
    );
    throw new Error("Failed to get verification token");
  }
}

export async function deleteVerificationToken(token: string): Promise<void> {
  try {
    await redis.del(`verify:${token}`);
  } catch (error) {
    console.error(
      "Error deleting verification token from Upstash Redis:",
      error
    );
    throw new Error("Failed to delete verification token");
  }
}

// Helper function to specifically set password change verification data
export async function setPasswordChangeVerification(
  token: string,
  data: Omit<PasswordChangeVerificationData, "type">,
  ttl: number = 1 * 60 * 60 // 1 hour for password change
): Promise<void> {
  try {
    const passwordChangeData: PasswordChangeVerificationData = {
      ...data,
      type: "password-change",
    };
    await redis.set(`verify:${token}`, JSON.stringify(passwordChangeData), {
      ex: ttl,
    });
  } catch (error) {
    console.error(
      "Error setting password change verification in Upstash Redis:",
      error
    );
    throw new Error("Failed to set password change verification");
  }
}

// Helper function to specifically get password change verification data
export async function getPasswordChangeVerification(
  token: string
): Promise<PasswordChangeVerificationData | null> {
  try {
    const verificationData = await getVerificationToken(token);
    if (
      verificationData &&
      "type" in verificationData &&
      verificationData.type === "password-change"
    ) {
      return verificationData as PasswordChangeVerificationData;
    }
    return null;
  } catch (error) {
    console.error(
      "Error getting password change verification from Upstash Redis:",
      error
    );
    throw new Error("Failed to get password change verification");
  }
}
