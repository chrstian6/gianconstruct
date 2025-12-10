import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, setSession, deleteSession } from "@/lib/redis";

// ---------------------------
// GET /api/auth/session
// ---------------------------
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    console.log("Session ID from cookie:", sessionId);

    if (!sessionId) {
      console.log("No sessionId cookie found");
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);

    console.log("Session data from Redis:", sessionData);

    if (!sessionData) {
      console.log("No session found for sessionId:", sessionId);
      // Clear invalid cookie
      cookieStore.delete("sessionId");
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: sessionData.userId,
        user_id: sessionData.user_id,
        email: sessionData.email,
        name: sessionData.firstName,
        lastName: sessionData.lastName || "",
        contactNo: sessionData.contactNo || "",
        role: sessionData.role || "user",
        avatar: sessionData.avatar || "",
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
// POST /api/auth/session
// Not used, as login is handled by actions/login.ts
// ---------------------------
export async function POST() {
  return NextResponse.json(
    { error: "Use /actions/login for login" },
    { status: 400 }
  );
}

// ---------------------------
// DELETE /api/auth/session
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
