import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, setSession, deleteSession } from "@/lib/redis";

// ---------------------------
// GET /api/session
// ---------------------------
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      console.log("No sessionId cookie found");
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    if (!sessionData) {
      console.log("No session found for sessionId:", sessionId);
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: sessionData.userId,
        user_id: sessionData.user_id,
        email: sessionData.email,
        name: sessionData.firstName,
        role: sessionData.role || "user",
      },
    });
  } catch (error) {
    console.error("Error in session GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

// ---------------------------
// POST /api/session
// Not used, as login is handled by actions/login.ts
// ---------------------------
export async function POST() {
  return NextResponse.json(
    { error: "Use /actions/login for login" },
    { status: 400 }
  );
}

// ---------------------------
// DELETE /api/session
// Log out
// ---------------------------
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (sessionId) {
      await deleteSession(sessionId); // Delete session from Redis
      console.log("Session deleted from Redis:", sessionId);
    } else {
      console.log("No sessionId cookie found for deletion");
    }

    cookieStore.delete("sessionId"); // Clear sessionId cookie
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in session DELETE:", error);
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 });
  }
}
