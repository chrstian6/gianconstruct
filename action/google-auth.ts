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
      redirect_uri: REDIRECT_URI, // Must match the one used in auth URL
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
    console.log("Google user info received for:", googleUser.email);

    // Connect to database
    await dbConnect();

    // Check if user exists by Google ID
    let user = await User.findOne({ googleId: googleUser.id });

    if (!user) {
      // Check if user exists by email
      user = await User.findOne({ email: googleUser.email });

      if (user) {
        // Update existing user with Google ID
        user.googleId = googleUser.id;
        user.googleAccessToken = tokens.access_token;

        // Only update refresh token if provided
        if (tokens.refresh_token) {
          user.googleRefreshToken = tokens.refresh_token;
        }

        // Update avatar if not set
        if (googleUser.picture && !user.avatar) {
          user.avatar = googleUser.picture;
        }
      } else {
        // Create new user
        const userId = await generateUserId();

        user = new User({
          user_id: userId,
          email: googleUser.email,
          firstName:
            googleUser.given_name || googleUser.name?.split(" ")[0] || "",
          lastName:
            googleUser.family_name ||
            googleUser.name?.split(" ").slice(1).join(" ") ||
            "",
          verified: true, // Google emails are verified
          googleId: googleUser.id,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || undefined, // Handle undefined
          avatar: googleUser.picture,
          role: "user",
        });
      }
    } else {
      // Update tokens for existing Google user
      user.googleAccessToken = tokens.access_token;

      // Only update refresh token if provided
      if (tokens.refresh_token) {
        user.googleRefreshToken = tokens.refresh_token;
      }
    }

    await user.save();
    console.log("User saved/updated:", user.email);

    // Create session
    const session = await manageSession(
      user._id.toString(),
      user.email,
      user.user_id,
      user.firstName || "",
      user.lastName || "",
      user.contactNo || "",
      user.avatar || ""
    );

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
      },
      redirectUri: state || "/user/userdashboard",
    };
  } catch (error: any) {
    console.error("Google callback error:", error);
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
