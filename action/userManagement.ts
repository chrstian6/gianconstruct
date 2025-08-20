// action/userManagement.ts
"use server";

import dbConnect from "../lib/db";
import User, { IUserDocument } from "../models/User";

export async function getUsers() {
  try {
    await dbConnect();
    const users = await User.find().lean().exec();
    return {
      success: true,
      users: users.map((user) => ({
        user_id: user.user_id, // Use user_id instead of _id
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        contactNo: user.contactNo,
        email: user.email,
        role: user.role,
        verified: user.verified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return { success: false, error: error.message || "Failed to fetch users" };
  }
}

export async function updateUserStatus(userId: string, verified: boolean) {
  try {
    await dbConnect();
    const user = await User.findOneAndUpdate(
      { user_id: userId }, // Use user_id for query
      { verified },
      { new: true }
    );
    if (!user) {
      return { success: false, error: "User not found" };
    }
    return { success: true, verified: user.verified };
  } catch (error: any) {
    console.error("Error updating user status:", error);
    return {
      success: false,
      error: error.message || "Failed to update user status",
    };
  }
}
