// app/api/auth/verify-password-change/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordChange } from "@/action/change-password";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/authentication-login?error=invalid_token`
      );
    }

    const result = await verifyPasswordChange(token);

    if (result.success) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/authentication-login?message=password_changed_successfully`
      );
    } else {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/authentication-login?error=password_change_failed&message=${encodeURIComponent(result.error || "Unknown error")}`
      );
    }
  } catch (error: any) {
    console.error("Password change verification error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/authentication-login?error=verification_failed`
    );
  }
}
