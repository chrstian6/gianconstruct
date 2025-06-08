// action/auth.ts
"use server";

import { nanoid } from "nanoid";
import { getSession, setSession, deleteSession } from "../lib/redis";
import User from "../models/User";

export async function manageSession(
  userId?: string,
  email?: string,
  user_id?: string
) {
  try {
    const sessionId = nanoid(32);

    if (userId && email && user_id) {
      // Fetch user to get role
      const user = await User.findOne({ _id: userId });
      if (!user) {
        throw new Error("User not found");
      }
      const sessionData = {
        userId,
        email,
        user_id,
        role: user.role,
        createdAt: new Date().toISOString(),
      };
      await setSession(sessionId, sessionData);
      return { sessionId, sessionData };
    } else {
      const sessionData = await getSession(sessionId);
      return { sessionData, sessionId };
    }
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
