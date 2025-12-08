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
    });

    // Connect to database
    await dbConnect();

    // FIRST: Check if user exists by Google ID (direct Google sign-in)
    let user = await User.findOne({ googleId: googleUser.id });

    if (user) {
      console.log("User found by Google ID:", user.email);

      // Verify email matches (security check)
      if (user.email.toLowerCase() !== googleUser.email.toLowerCase()) {
        console.error(
          "Email mismatch: User email",
          user.email,
          "vs Google email",
          googleUser.email
        );
        return {
          success: false,
          error: "Email mismatch detected. Please contact support.",
        };
      }

      // Update tokens
      user.googleAccessToken = tokens.access_token;
      if (tokens.refresh_token) {
        user.googleRefreshToken = tokens.refresh_token;
      }

      // Update avatar if new one is available
      if (googleUser.picture) {
        user.avatar = googleUser.picture;
      }

      await user.save();
      console.log("Existing Google user updated:", user.email);
    } else {
      // No user with this Google ID - check by email (case-insensitive)
      const googleEmail = googleUser.email.toLowerCase();
      user = await User.findOne({
        email: { $regex: new RegExp(`^${googleEmail}$`, "i") },
      });

      if (user) {
        console.log("User found by email:", user.email);

        // Verify email matches exactly (case-insensitive comparison)
        if (user.email.toLowerCase() !== googleEmail) {
          console.error(
            "Email case mismatch: User email",
            user.email,
            "vs Google email",
            googleEmail
          );
          // Normalize the email in database to lowercase
          user.email = googleEmail;
        }

        // Check if user already has a different Google account linked
        if (user.googleId && user.googleId !== googleUser.id) {
          console.log("Different Google account for same email");
          return {
            success: false,
            error: `This email is already associated with a different Google account. Please use your original Google account to sign in, or use email/password login.`,
          };
        }

        // Check if user has password auth
        const hasPassword = !!user.password;
        const hasGoogle = !!user.googleId;

        if (hasPassword && !hasGoogle) {
          // User has password auth but no Google ID - link them
          console.log("Linking Google account to existing email/password user");
          user.googleId = googleUser.id;
          user.googleAccessToken = tokens.access_token;
          if (tokens.refresh_token) {
            user.googleRefreshToken = tokens.refresh_token;
          }

          // Mark as verified if not already
          if (!user.verified) {
            user.verified = true;
          }

          // Update user info from Google if missing
          if (!user.firstName && googleUser.given_name) {
            user.firstName = googleUser.given_name;
          }
          if (!user.lastName && googleUser.family_name) {
            user.lastName = googleUser.family_name;
          }
          if (!user.avatar && googleUser.picture) {
            user.avatar = googleUser.picture;
          }

          await user.save();
          console.log("Google account linked to existing user:", user.email);

          // Send notification email about account linking
          try {
            console.log("Sending account linking notification to:", user.email);
            // Add your email sending logic here
          } catch (emailError) {
            console.warn("Failed to send linking notification:", emailError);
          }
        } else if (!hasPassword && !hasGoogle) {
          // User exists but has no auth method (shouldn't happen, but handle it)
          console.log("User exists with no auth method - linking Google");
          user.googleId = googleUser.id;
          user.googleAccessToken = tokens.access_token;
          if (tokens.refresh_token) {
            user.googleRefreshToken = tokens.refresh_token;
          }
          user.verified = true;

          // Update user info from Google
          if (googleUser.given_name) user.firstName = googleUser.given_name;
          if (googleUser.family_name) user.lastName = googleUser.family_name;
          if (googleUser.picture) user.avatar = googleUser.picture;

          await user.save();
          console.log(
            "Google account linked to user with no auth method:",
            user.email
          );
        } else {
          // Should not reach here, but handle gracefully
          console.log("Unexpected user state - proceeding with login");
        }
      } else {
        // Completely new user - create with Google
        console.log("Creating new user with Google");
        const userId = await generateUserId();

        user = new User({
          user_id: userId,
          email: googleEmail, // Use normalized lowercase email
          firstName:
            googleUser.given_name || googleUser.name?.split(" ")[0] || "",
          lastName:
            googleUser.family_name ||
            googleUser.name?.split(" ").slice(1).join(" ") ||
            "",
          verified: true,
          googleId: googleUser.id,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || undefined,
          avatar: googleUser.picture,
          role: "user",
        });

        await user.save();
        console.log("New Google user created:", user.email);

        // Send welcome email for new Google users
        try {
          console.log("Sending welcome email to new Google user:", user.email);
          // Add your welcome email sending logic here
        } catch (emailError) {
          console.warn("Failed to send welcome email:", emailError);
        }
      }
    }

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
