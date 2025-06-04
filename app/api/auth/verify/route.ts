import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User, { IUserDocument } from "@/models/User";
import { Redis } from "@upstash/redis";

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await dbConnect();

    // Initialize Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL as string,
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    });

    // Extract token from query
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "No verification token provided" },
        { status: 400 }
      );
    }

    // Retrieve verification data from Redis
    const verificationData = await redis.get(`verify:${token}`);
    if (!verificationData) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Parse verification data
    const { userId, email, user_id } =
      typeof verificationData === "string"
        ? JSON.parse(verificationData)
        : verificationData;

    // Find and update user
    const user = await User.findByIdAndUpdate<IUserDocument>(
      userId,
      { verified: true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Delete verification token from Redis
    await redis.del(`verify:${token}`);

    // Log success
    console.log(`User verified: ${email} with user_id: ${user_id}`);

    // Redirect to home page (app/page.tsx) with verified query
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?verified=true`
    );
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Verification failed: ${error.message || "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
