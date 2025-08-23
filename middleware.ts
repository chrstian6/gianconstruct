import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/redis";

const protectedAdminRoutes = ["/admin/:path*"];
const protectedUserRoutes = ["/user/:path*"];
const publicRoutes = ["/", "/catalog"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Validate session using verifySession
  const session = await verifySession();
  const userRole = session?.role;

  // Handle protected routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/user")) {
    if (!session) {
      console.log("Unauthorized access to protected route:", pathname);
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Role-based access control
    if (pathname.startsWith("/admin") && userRole !== "admin") {
      console.log("Non-admin attempted to access admin route:", {
        userRole,
        pathname,
      });
      return NextResponse.redirect(new URL("/user/userdashboard", request.url));
    }
    if (pathname.startsWith("/user") && userRole !== "user") {
      console.log("Non-user attempted to access user route:", {
        userRole,
        pathname,
      });
      return NextResponse.redirect(
        new URL("/admin/admindashboard", request.url)
      );
    }
  }

  // Prevent authenticated users from accessing public routes
  if (publicRoutes.includes(pathname) && session) {
    const redirectPath =
      userRole === "admin" ? "/admin/admindashboard" : "/user/userdashboard";
    console.log("Authenticated user redirected from public route:", {
      pathname,
      redirectPath,
    });
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.headers.set("X-Auth-Redirect", "true"); // Signal client to enforce redirect
    return response;
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*", "/", "/catalog"], // Explicitly include /catalog
};
