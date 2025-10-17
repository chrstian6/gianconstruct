"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

interface UpdateProfileData {
  firstName: string;
  lastName: string;
  address: string;
  contactNo?: string;
  avatar?: string;
}

// Helper function to clean and format strings with first letter uppercase
function cleanString(str: string): string {
  if (!str || typeof str !== "string") return str;

  return str
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
    .replace(/\s+/g, " ") // Ensure single spaces again
    .trim();
}

// Helper function to clean address with proper capitalization
function cleanAddress(address: string): string {
  if (!address || typeof address !== "string") return address;

  return address
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
    .trim();
}

// Helper function to clean and format contact number (maintain xxxx xxx xxxx format)
function cleanContactNumber(contactNo: string): string {
  if (!contactNo || typeof contactNo !== "string") return contactNo;

  // Remove all non-digit characters first
  const digitsOnly = contactNo.replace(/\D/g, "");

  // Format as xxxx xxx xxxx if we have 11 digits
  if (digitsOnly.length === 11) {
    return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4, 7)} ${digitsOnly.slice(7, 11)}`;
  }

  // For other lengths, just return the digits (no formatting)
  return digitsOnly;
}

export async function updateUserProfile(
  userId: string,
  profileData: UpdateProfileData
) {
  try {
    await dbConnect();

    console.log("Updating user profile:", { userId, profileData }); // Debug log

    // Clean and format all input data
    const cleanedData = {
      firstName: cleanString(profileData.firstName),
      lastName: cleanString(profileData.lastName),
      address: cleanAddress(profileData.address),
      contactNo: profileData.contactNo
        ? cleanContactNumber(profileData.contactNo)
        : undefined,
    };

    console.log("Cleaned profile data:", cleanedData); // Debug log

    const updateData: any = {
      firstName: cleanedData.firstName,
      lastName: cleanedData.lastName,
      address: cleanedData.address,
      contactNo: cleanedData.contactNo,
      updatedAt: new Date(),
    };

    // Only include avatar if it's provided
    if (profileData.avatar !== undefined) {
      updateData.avatar = profileData.avatar;
    }

    const user = await User.findOneAndUpdate({ user_id: userId }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    console.log("Updated user:", user); // Debug log

    // Revalidate any relevant paths
    revalidatePath("/user/dashboard");
    revalidatePath("/user/catalog");

    return {
      success: true,
      user: {
        user_id: user.user_id,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        contactNo: user.contactNo,
        email: user.email,
        avatar: user.avatar || "", // Ensure avatar is always returned
        role: user.role,
        verified: user.verified,
      },
    };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error.message || "Failed to update profile",
    };
  }
}

export async function getUserData(userId: string) {
  try {
    await dbConnect();

    const user = await User.findOne({ user_id: userId }).select(
      "firstName lastName address contactNo email avatar"
    );

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      user: {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        address: user.address || "",
        contactNo: user.contactNo || "",
        email: user.email || "",
        avatar: user.avatar || "",
      },
    };
  } catch (error: any) {
    console.error("Error fetching user data:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch user data",
    };
  }
}
