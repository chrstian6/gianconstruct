"use server";

import { OAuth2Client } from "google-auth-library";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { manageSession } from "./auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Get the base URL for redirect
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI // Use the actual redirect URI
);

async function generateUserId(): Promise<string> {
  await dbConnect();

  const lastUser = await User.findOne(
    { user_id: { $regex: /^GC-\d+$/ } },
    { user_id: 1 },
    { sort: { user_id: -1 } }
  );

  let nextNumber = 1;

  if (lastUser && lastUser.user_id) {
    const lastNumber = parseInt(lastUser.user_id.split("-")[1]);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `GC-${nextNumber.toString().padStart(4, "0")}`;
}

export async function getGoogleAuthUrl(redirectUri: string) {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent",
      state: redirectUri,
      redirect_uri: REDIRECT_URI, // Explicitly include redirect_uri
      include_granted_scopes: true,
    });

    console.log("Generated Google Auth URL (for debugging):", authUrl);
    return authUrl;
  } catch (error) {
    console.error("Error generating Google auth URL:", error);
    throw error;
  }
}

export async function handleGoogleCallback(code: string, state?: string) {
  try {
    if (!code) {
      return {
        success: false,
        error: "Authorization code is required",
      };
    }

    console.log(
      "Processing Google callback with code:",
      code.substring(0, 20) + "..."
    );

    // Exchange authorization code for tokens with explicit redirect_uri
    const { tokens } = await oauth2Client.getToken({
      code: code,
      redirect_uri: REDIRECT_URI,
    });

    console.log(
      "Received tokens from Google:",
      tokens.access_token ? "Yes" : "No"
    );

    if (!tokens.access_token) {
      return {
        success: false,
        error: "Failed to get access token",
      };
    }

    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return {
        success: false,
        error: "Failed to fetch user info from Google",
      };
    }

    const googleUser = await userInfoResponse.json();
    console.log("Google user info received:", {
      email: googleUser.email,
      id: googleUser.id,
      name: googleUser.name,
      given_name: googleUser.given_name,
      family_name: googleUser.family_name,
    });

    // Connect to database
    await dbConnect();

    const googleEmail = googleUser.email.toLowerCase();

    // CRITICAL: ALWAYS CHECK BY EMAIL FIRST (case-insensitive)
    let user = await User.findOne({
      email: { $regex: new RegExp(`^${googleEmail}$`, "i") },
    });

    if (user) {
      console.log("✅ User found by email in database:", {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        user_id: user.user_id,
      });

      // IMPORTANT: Use database user's information, NOT Google's
      // Only update Google-specific fields and tokens
      user.googleId = googleUser.id;
      user.googleAccessToken = tokens.access_token;
      if (tokens.refresh_token) {
        user.googleRefreshToken = tokens.refresh_token;
      }

      // Update avatar if new one is available and user doesn't have one
      if (googleUser.picture && !user.avatar) {
        user.avatar = googleUser.picture;
      }

      // Mark as verified if not already
      if (!user.verified) {
        user.verified = true;
      }

      await user.save();
      console.log("✅ Existing user linked with Google:", user.email);
    } else {
      // No user with this email exists - create new user
      console.log("🆕 Creating new user from Google");

      // Parse Google name to separate first and last name
      let firstName = googleUser.given_name || "";
      let lastName = googleUser.family_name || "";

      // If Google provides full name only (no given_name/family_name)
      if (!firstName && googleUser.name) {
        const names = googleUser.name.trim().split(" ");
        firstName = names[0] || "";
        lastName = names.slice(1).join(" ") || "";
      }

      const userId = await generateUserId();

      user = new User({
        user_id: userId,
        email: googleEmail,
        firstName: firstName,
        lastName: lastName,
        verified: true,
        googleId: googleUser.id,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || undefined,
        avatar: googleUser.picture,
        role: "user",
      });

      await user.save();
      console.log("✅ New Google user created:", {
        email: user.email,
        user_id: user.user_id,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }

    // Create session using database user's information
    const session = await manageSession(
      user._id.toString(),
      user.email,
      user.user_id,
      user.firstName || "",
      user.lastName || "",
      user.contactNo || "",
      user.avatar || ""
    );

    console.log("✅ Session created for:", {
      email: user.email,
      user_id: user.user_id,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      success: true,
      sessionId: session.sessionId,
      user: {
        user_id: user.user_id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        contactNo: user.contactNo,
      },
      redirectUri: state || "/user/userdashboard",
    };
  } catch (error: any) {
    console.error("❌ Google callback error:", error);
    return {
      success: false,
      error: error.message || "Authentication failed",
    };
  }
}

export async function refreshGoogleToken(userId: string) {
  try {
    await dbConnect();

    const user = await User.findById(userId);

    if (!user || !user.googleRefreshToken) {
      return {
        success: false,
        error: "User not found or no refresh token available",
      };
    }

    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (credentials.access_token) {
      user.googleAccessToken = credentials.access_token;
      if (credentials.refresh_token) {
        user.googleRefreshToken = credentials.refresh_token;
      }
      await user.save();
    }

    return {
      success: true,
      accessToken: credentials.access_token,
    };
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return {
      success: false,
      error: "Failed to refresh token",
    };
  }
}

export async function disconnectGoogle(userId: string) {
  try {
    await dbConnect();

    const user = await User.findById(userId);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Revoke token if available
    if (user.googleAccessToken) {
      try {
        await oauth2Client.revokeToken(user.googleAccessToken);
      } catch (revokeError) {
        console.warn("Failed to revoke token:", revokeError);
      }
    }

    // Remove Google-specific fields
    user.googleId = undefined;
    user.googleAccessToken = undefined;
    user.googleRefreshToken = undefined;

    await user.save();

    return {
      success: true,
      message: "Google account disconnected",
    };
  } catch (error: any) {
    console.error("Disconnect Google error:", error);
    return {
      success: false,
      error: error.message || "Failed to disconnect Google account",
    };
  }
}
