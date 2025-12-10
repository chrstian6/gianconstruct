// lib/redis.ts - UPDATED FOR MIDDLEWARE COMPATIBILITY
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

export async function verifySessionFromRequest(
  sessionId: string
): Promise<SessionData | null> {
  try {
    console.log("Middleware: Verifying session ID:", sessionId);

    if (!sessionId) {
      console.log("Middleware: No sessionId provided");
      return null;
    }

    const sessionData = await redis.get(`session:${sessionId}`);

    console.log("Middleware: Redis response for session:", {
      hasData: !!sessionData,
      type: typeof sessionData,
    });

    if (!sessionData) {
      console.log("Middleware: No session found in Redis");
      return null;
    }

    // Parse session data
    let parsedData: SessionData;
    if (typeof sessionData === "string") {
      try {
        parsedData = JSON.parse(sessionData) as SessionData;
      } catch (parseError) {
        console.error("Middleware: Error parsing session data:", parseError);
        return null;
      }
    } else {
      parsedData = sessionData as SessionData;
    }

    console.log("Middleware: Successfully verified session for:", {
      email: parsedData.email,
      role: parsedData.role,
      user_id: parsedData.userId,
    });

    return parsedData;
  } catch (error) {
    console.error("Middleware: Error verifying session:", error);
    return null;
  }
}

// Keep existing verifySession for server components/actions
export async function verifySession(): Promise<SessionData | null> {
  try {
    const sessionId = (await cookies()).get("sessionId")?.value;
    console.log("Server: Session ID from cookies:", sessionId);

    if (!sessionId) {
      console.log("Server: No sessionId cookie found");
      return null;
    }

    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      console.log("Server: No session found for sessionId:", sessionId);
      (await cookies()).delete("sessionId");
      return null;
    }

    if (typeof sessionData === "string") {
      return JSON.parse(sessionData) as SessionData;
    }
    return sessionData as SessionData;
  } catch (error) {
    console.error("Server: Error verifying session in Upstash Redis:", error);
    return null;
  }
}

// Keep all existing functions unchanged...
export async function getSession(
  sessionId: string
): Promise<SessionData | null> {
  try {
    const sessionData = await redis.get(`session:${sessionId}`);

    console.log(
      "Retrieved session data from Redis for ID:",
      sessionId,
      sessionData
    );

    if (!sessionData) {
      console.log("No session data found in Redis");
      return null;
    }

    if (typeof sessionData === "object" && sessionData !== null) {
      return sessionData as SessionData;
    }

    if (typeof sessionData === "string") {
      try {
        return JSON.parse(sessionData) as SessionData;
      } catch (parseError) {
        console.error("Error parsing session data:", parseError);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting session from Upstash Redis:", error);
    return null;
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

      if (parsedData.type === "password-change") {
        return parsedData as PasswordChangeVerificationData;
      } else {
        return parsedData as VerificationData;
      }
    }

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

export async function setPasswordChangeVerification(
  token: string,
  data: Omit<PasswordChangeVerificationData, "type">,
  ttl: number = 1 * 60 * 60
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
