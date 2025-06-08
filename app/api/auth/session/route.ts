// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, setSession, deleteSession } from "@/lib/redis";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;
    if (!sessionId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const sessionData = await getSession(sessionId);
    if (!sessionData) {
      const cookieStore = await cookies();
      cookieStore.delete("sessionId");
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        user_id: sessionData.user_id,
        email: sessionData.email,
        role: sessionData.role,
      },
    });
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
    const { user } = await request.json();
    if (!user || !user.user_id || !user.email || !user.role) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }

    const sessionId = nanoid(32);
    const sessionData = {
      userId: user.user_id,
      email: user.email,
      user_id: user.user_id,
      role: user.role,
      createdAt: new Date().toISOString(),
    };

    await setSession(sessionId, sessionData);
    const cookieStore = await cookies();
    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;
    if (!sessionId) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    await deleteSession(sessionId);
    cookieStore.delete("sessionId");

    return NextResponse.json({ success: true });
  } catch (error) {
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
