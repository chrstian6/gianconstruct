import { NextRequest, NextResponse } from "next/server";
import { manageSession } from "@/action/auth";

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
    const result = await manageSession(data);
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
    const result = await manageSession({ user: null });
    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/auth/session error:", error);
    return NextResponse.json(
      { error: "Internal server error", user: null },
      { status: 500 }
    );
  }
}
