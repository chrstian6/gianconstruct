// actions/auth.ts
"use server";

import { nanoid } from "nanoid";
import { getSession, setSession, deleteSession } from "../lib/redis";
import User from "../models/User";

export async function manageSession(
  userId: string,
  email: string,
  user_id: string,
  firstName: string
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
      role: user.role,
      createdAt: new Date().toISOString(),
    };
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
