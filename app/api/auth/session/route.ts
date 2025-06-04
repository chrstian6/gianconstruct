import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { manageSession, endSession } from "@/action/auth";

export async function GET() {
  try {
    const result = await manageSession();
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/auth/session error:", error);
    return NextResponse.json(
      { error: "Internal server error", user: null },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await manageSession(data.userId, data.email, data.user_id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/auth/session error:", error);
    return NextResponse.json(
      { error: "Internal server error", user: null },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 400 }
      );
    }

    await endSession(sessionId);
    cookieStore.delete("sessionId");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/auth/session error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to delete session: ${(error as Error).message || "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
