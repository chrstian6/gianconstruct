// action/userManagement.ts
"use server";

import dbConnect from "../lib/db";
import User, { IUserDocument, USER_ROLES, UserRole } from "../models/User";
import { sendEmail } from "../lib/nodemailer";
import { generateEmailTemplate } from "../lib/email-templates";

// Helper function to clean and format strings
function cleanString(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
    .replace(/\s+/g, " ") // Ensure single spaces again
    .trim();
}

// Helper function to clean email
function cleanEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Helper function to clean contact number
function cleanContactNumber(contactNo: string): string {
  return contactNo.trim().replace(/\s+/g, ""); // Remove all spaces
}

// Helper function to clean address
function cleanAddress(address: string): string {
  return address
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
    .trim();
}

// Generate user_id in GC-0001 format
async function generateUserId(): Promise<string> {
  await dbConnect();

  // Find the highest existing user_id with GC- prefix
  const lastUser = await User.findOne(
    { user_id: { $regex: /^GC-\d+$/ } },
    { user_id: 1 },
    { sort: { user_id: -1 } }
  );

  let nextNumber = 1;

  if (lastUser && lastUser.user_id) {
    // Extract the number part from the last user_id (e.g., "GC-0042" -> 42)
    const lastNumber = parseInt(lastUser.user_id.split("-")[1]);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Format as GC-0001, GC-0002, etc. with leading zeros
  return `GC-${nextNumber.toString().padStart(4, "0")}`;
}

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

// Helper function to format role for display
export async function formatRoleForDisplay(role: UserRole): Promise<string> {
  switch (role) {
    case USER_ROLES.ADMIN:
      return "Administrator";
    case USER_ROLES.PROJECT_MANAGER:
      return "Project Manager";
    case USER_ROLES.USER:
      return "User";
    default:
      return role;
  }
}

// Updated createUser function that matches otp-signup.ts and includes password in email
export async function createUser(userData: {
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string;
  address: string;
  password: string;
  role?: UserRole;
}) {
  try {
    await dbConnect();

    // Clean the input data
    const cleanedData = {
      firstName: cleanString(userData.firstName),
      lastName: cleanString(userData.lastName),
      email: cleanEmail(userData.email),
      contactNo: userData.contactNo
        ? cleanContactNumber(userData.contactNo)
        : undefined,
      address: cleanAddress(userData.address),
      password: userData.password,
      role: userData.role || USER_ROLES.USER,
    };

    // Validate role against enum values
    const validRoles = Object.values(USER_ROLES);
    if (!validRoles.includes(cleanedData.role as UserRole)) {
      return {
        success: false,
        error: `Invalid role specified. Must be one of: ${validRoles.join(", ")}`,
      };
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: cleanedData.email },
        ...(cleanedData.contactNo
          ? [{ contactNo: cleanedData.contactNo }]
          : []),
      ],
    });

    if (existingUser) {
      const errors: string[] = [];
      if (existingUser.email === cleanedData.email) {
        errors.push("Email already in use");
      }
      if (
        cleanedData.contactNo &&
        existingUser.contactNo === cleanedData.contactNo
      ) {
        errors.push("Contact number already in use");
      }
      return {
        success: false,
        error: errors.join(" and "),
      };
    }

    // Generate unique user_id in GC-XXXX format
    const user_id = await generateUserId();

    // Create a new user instance
    const user = new User({
      user_id,
      firstName: cleanedData.firstName,
      lastName: cleanedData.lastName,
      email: cleanedData.email,
      contactNo: cleanedData.contactNo,
      address: cleanedData.address,
      role: cleanedData.role,
      verified: true, // Admin-created users are automatically verified
      timeStamp: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as IUserDocument;

    // Store the plain text password temporarily for the email
    const temporaryPassword = cleanedData.password;

    // Use the model's hashPassword method
    if (typeof user.hashPassword !== "function") {
      console.error("hashPassword is not a function on user instance");
      throw new Error("Password hashing method is unavailable");
    }

    await user.hashPassword(cleanedData.password);

    // Save the user to database
    await user.save();

    console.log(
      `Admin created user in gianconstruct.users: ${user.email} with user_id: ${user.user_id}, role: ${user.role}`
    );

    // Send welcome email to the user WITH temporary password
    try {
      const welcomeEmailData = {
        title: "Your GianConstruct Account Has Been Created",
        message: `Dear <strong>${user.firstName} ${user.lastName}</strong>,<br><br>An administrator has created an account for you in the GianConstruct system. Below are your login credentials:<br><br><strong>Important:</strong> For security reasons, you must change your password immediately after your first login.`,
        details: `
          <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">Login Credentials</div>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 12px;">
              <div style="font-weight: 600; color: #374151;">Email Address:</div>
              <div style="font-family: monospace;">${user.email}</div>

              <div style="font-weight: 600; color: #374151;">Temporary Password:</div>
              <div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: 1px; color: #111827;">
                  ${temporaryPassword}
                </div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                  ⚠️ This password is temporary and should be changed immediately
                </div>
              </div>
            </div>
          </div>

          <div class="detail-row">
            <div class="detail-label">User ID</div>
            <div class="detail-value">${user.user_id}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Full Name</div>
            <div class="detail-value">${user.firstName} ${user.lastName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Account Type</div>
            <div class="detail-value">${formatRoleForDisplay(user.role as UserRole)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Account Status</div>
            <div class="detail-value" style="color: #10b981; font-weight: bold;">✓ Verified & Active</div>
          </div>
          ${
            user.contactNo
              ? `
          <div class="detail-row">
            <div class="detail-label">Contact Number</div>
            <div class="detail-value">${user.contactNo}</div>
          </div>
          `
              : ""
          }
          ${
            user.address
              ? `
          <div class="detail-row">
            <div class="detail-label">Address</div>
            <div class="detail-value">${user.address}</div>
          </div>
          `
              : ""
          }
          <div class="detail-row">
            <div class="detail-label">Account Created</div>
            <div class="detail-value">${new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</div>
          </div>
        `,
        nextSteps: `<strong>Next Steps:</strong><br>
          1. Log in using the credentials above<br>
          2. You will be prompted to change your password immediately<br>
          3. Review your account information<br>
          4. Start using the GianConstruct system<br><br>
          <strong>Security Notice:</strong> Never share your password with anyone. GianConstruct administrators will never ask for your password.`,
        showButton: true,
        buttonText: "Login to GianConstruct",
        buttonUrl:
          process.env.NEXT_PUBLIC_APP_URL || "https://gianconstruct.com",
        footerNote:
          "This email contains sensitive login information. Please keep it secure and delete it after changing your password.",
      };

      await sendEmail({
        to: user.email,
        subject: `Your GianConstruct Account Credentials - ${user.user_id}`,
        html: generateEmailTemplate(welcomeEmailData),
      });

      console.log(
        `Welcome email sent to ${user.email} with temporary password`
      );
    } catch (emailError: any) {
      console.error("Failed to send welcome email:", emailError);
      // Even if email fails, we should still return success since user was created
      // But we should inform the admin that email wasn't sent
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
        warning: `User created but email failed to send: ${emailError.message}`,
        temporaryPassword: temporaryPassword, // Return password so admin can manually share it
      };
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
      message: `User created successfully. Login credentials have been sent to ${user.email}.`,
    };
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return { success: false, error: "User with this email already exists" };
      }
      if (error.keyPattern?.contactNo) {
        return {
          success: false,
          error: "User with this contact number already exists",
        };
      }
      if (error.keyPattern?.user_id) {
        // This should rarely happen with our generation logic, but handle it
        return { success: false, error: "User ID conflict. Please try again." };
      }
    }

    return {
      success: false,
      error: error.message || "Failed to create user",
    };
  }
}

// Helper function to get all valid roles (make it async)
export async function getValidUserRoles(): Promise<string[]> {
  return Object.values(USER_ROLES);
}

// Helper function to format role for display (make it async)
export async function formatRoleDisplay(role: string): Promise<string> {
  return formatRoleForDisplay(role as UserRole);
}

// NEW FUNCTION: Check if email is available
export async function checkEmailAvailability(email: string): Promise<{
  available: boolean;
  error?: string;
  email: string;
}> {
  try {
    await dbConnect();

    if (!email) {
      return {
        available: false,
        error: "Email is required",
        email,
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        available: false,
        error: "Invalid email format",
        email,
      };
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    return {
      available: !existingUser,
      email,
    };
  } catch (error: any) {
    console.error("Error checking email availability:", error);
    return {
      available: false,
      error: error.message || "Error checking email availability",
      email,
    };
  }
}
