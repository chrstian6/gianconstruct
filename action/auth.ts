// actions/auth.ts
"use server";

import { nanoid } from "nanoid";
import { setSession, deleteSession, verifySession } from "../lib/redis";
import User from "../models/User";
import { cookies } from "next/headers";

export async function manageSession(
  userId: string,
  email: string,
  user_id: string,
  firstName: string,
  lastName: string,
  contactNo: string,
  avatar: string
) {
  try {
    const sessionId = nanoid(32);
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error("User not found");
    }
    const sessionData = {
      userId,
      email,
      user_id,
      firstName,
      lastName,
      contactNo,
      avatar,
      role: user.role,
      createdAt: new Date().toISOString(),
    };

    // Store session in Redis
    await setSession(sessionId, sessionData);

    return { sessionId, sessionData };
  } catch (error: any) {
    console.error("Session management error:", error);
    throw new Error("Failed to manage session");
  }
}

export async function endSession(sessionId: string) {
  try {
    await deleteSession(sessionId);
  } catch (error: any) {
    console.error("Session end error:", error);
    throw new Error("Failed to end session");
  }
}

export async function getSession() {
  try {
    const session = await verifySession();
    if (!session) {
      return null;
    }
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function getUserId() {
  try {
    const session = await getSession();
    return session?.userId || null;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
}

// New function to set session cookie
export async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60, // 24 hours
  });
}

// New function to clear session cookie
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
