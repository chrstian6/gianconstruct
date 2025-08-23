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
        user_id: user.user_id,
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
      { user_id: userId },
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

// Define the update data type excluding the date fields and role
interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  address?: string;
  contactNo?: string;
  email?: string;
  verified?: boolean;
}

export async function updateUser(userId: string, userData: UpdateUserData) {
  try {
    await dbConnect();

    const user = await User.findOneAndUpdate({ user_id: userId }, userData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      user: {
        user_id: user.user_id,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        contactNo: user.contactNo,
        email: user.email,
        role: user.role,
        verified: user.verified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: error.message || "Failed to update user",
    };
  }
}

// Add this to your existing action/userManagement.ts
export async function createUser(userData: {
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string;
  address: string;
  password: string;
}) {
  try {
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return { success: false, error: "User with this email already exists" };
    }

    // Create new user
    const user = await User.create({
      user_id: `user_${Date.now()}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      contactNo: userData.contactNo,
      address: userData.address,
      password: userData.password, // This should be hashed in a real implementation
      role: "user",
      verified: true,
    });

    return {
      success: true,
      user: {
        user_id: user.user_id,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        contactNo: user.contactNo,
        email: user.email,
        role: user.role,
        verified: user.verified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: error.message || "Failed to create user",
    };
  }
}
