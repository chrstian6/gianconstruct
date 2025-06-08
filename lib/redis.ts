"use server";

import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";

interface SessionData {
  userId: string;
  email: string;
  user_id: string;
  role: string;
  createdAt: string;
}

interface VerificationData {
  userId: string;
  email: string;
  user_id: string;
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
  data: VerificationData,
  ttl: number = 24 * 60 * 60
): Promise<void> {
  try {
    await redis.set(`verify:${token}`, JSON.stringify(data), { ex: ttl });
  } catch (error) {
    console.error("Error setting verification token in Upstash Redis:", error);
    throw new Error("Failed to set verification token");
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
