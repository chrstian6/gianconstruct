import { NextRequest, NextResponse } from "next/server";
import { handleGoogleCallback } from "@/action/google-auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/authentication-login?error=no_code`
      );
    }

    const result = await handleGoogleCallback(code, state || undefined);

    if (!result.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/authentication-login?error=${encodeURIComponent(result.error || "authentication_failed")}`
      );
    }

    // Set session cookie
    if (result.sessionId) {
      (await cookies()).set({
        name: "sessionId",
        value: result.sessionId,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60, // 24 hours
      });
    }

    // Redirect to the intended page or user dashboard
    const redirectPath = result.redirectUri || "/user/userdashboard";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${redirectPath}`
    );
  } catch (error: any) {
    console.error("Google callback route error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/authentication-login?error=${encodeURIComponent(error.message || "server_error")}`
    );
  }
}
