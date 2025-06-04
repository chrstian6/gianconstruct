"use server";

import { Redis } from "@upstash/redis";

// Shared Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

export async function getSession(sessionId: string): Promise<any> {
  try {
    const keys = await redis.keys(`session:${sessionId}`);
    if (keys.length > 0) {
      const sessionData = await redis.get(keys[0]);
      if (!sessionData) return null;
      if (typeof sessionData === "string") {
        return JSON.parse(sessionData);
      }
      return sessionData;
    }
    return null;
  } catch (error) {
    console.error("Error getting session from Upstash Redis:", error);
    throw new Error("Failed to get session");
  }
}

export async function setSession(
  sessionId: string,
  data: any,
  ttl: number = 24 * 60 * 60
): Promise<void> {
  try {
    await redis.set(`session:${sessionId}`, JSON.stringify(data), { ex: ttl });
  } catch (error) {
    console.error("Error setting session in Upstash Redis:", error);
    throw new Error("Failed to set session");
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const keys = await redis.keys(`session:${sessionId}`);
    if (keys.length > 0) {
      await redis.del(keys[0]);
    }
  } catch (error) {
    console.error("Error deleting session from Upstash Redis:", error);
    throw new Error("Failed to delete session");
  }
}

export async function setVerificationToken(
  token: string,
  data: any,
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
