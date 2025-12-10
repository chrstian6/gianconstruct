// middleware.ts - UPDATED
import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/redis"; // Use the new function

const publicRoutes = [
  "/",
  "/catalog",
  "/authentication-login",
  "/authentication-login/otp",
  "/authentication-login/signup",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("Middleware triggered for path:", pathname);

  // Get sessionId directly from request cookies (middleware runs at edge)
  const sessionId = request.cookies.get("sessionId")?.value;
  console.log("Middleware: sessionId from cookies:", sessionId);

  // Validate session using the middleware-friendly function
  let session = null;
  let userRole = null;

  if (sessionId) {
    session = await verifySessionFromRequest(sessionId);
    userRole = session?.role;

    console.log("Middleware: Session verification result:", {
      hasSession: !!session,
      userRole: userRole,
      email: session?.email,
    });
  }

  // Handle protected routes - ALL PROTECTED ROUTES IN ONE PLACE
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/user") ||
    pathname.startsWith("/project-manager")
  ) {
    if (!session) {
      console.log("Unauthorized access to protected route:", pathname);
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Role-based access control for all protected routes
    if (pathname.startsWith("/admin") && userRole !== "admin") {
      console.log("Non-admin attempted to access admin route:", {
        userRole,
        pathname,
      });

      // Redirect based on actual role
      if (userRole === "project_manager") {
        return NextResponse.redirect(
          new URL("/project-manager/manage-project", request.url)
        );
      } else if (userRole === "user") {
        return NextResponse.redirect(
          new URL("/user/userdashboard", request.url)
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/user") && userRole !== "user") {
      console.log("Non-user attempted to access user route:", {
        userRole,
        pathname,
      });

      // Redirect based on actual role
      if (userRole === "admin") {
        return NextResponse.redirect(
          new URL("/admin/admindashboard", request.url)
        );
      } else if (userRole === "project_manager") {
        return NextResponse.redirect(
          new URL("/project-manager/manage-project", request.url)
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    // FIX: Project manager route protection - was in wrong place
    if (
      pathname.startsWith("/project-manager") &&
      userRole !== "project_manager"
    ) {
      console.log(
        "Non-project manager attempted to access project manager route:",
        {
          userRole,
          pathname,
        }
      );

      // Redirect based on actual role
      if (userRole === "admin") {
        return NextResponse.redirect(
          new URL("/admin/admindashboard", request.url)
        );
      } else if (userRole === "user") {
        return NextResponse.redirect(
          new URL("/user/userdashboard", request.url)
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Prevent authenticated users from accessing public routes
  if (publicRoutes.includes(pathname) && session) {
    let redirectPath = "/";

    // Determine redirect based on role
    switch (userRole) {
      case "admin":
        redirectPath = "/admin/admindashboard";
        break;
      case "user":
        redirectPath = "/user/userdashboard";
        break;
      case "project_manager":
        redirectPath = "/project-manager/manage-project";
        break;
      default:
        redirectPath = "/";
    }

    console.log("Authenticated user redirected from public route:", {
      pathname,
      userRole,
      redirectPath,
    });
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.headers.set("X-Auth-Redirect", "true");
    return response;
  }

  // Allow the request to proceed
  const response = NextResponse.next();

  // Add debugging headers for development
  if (process.env.NODE_ENV === "development") {
    response.headers.set("X-Debug-Session-ID", sessionId || "none");
    response.headers.set("X-Debug-Authenticated", session ? "yes" : "no");
    response.headers.set("X-Debug-User-Role", userRole || "none");
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/project-manager/:path*", // ADD THIS LINE
    "/",
    "/catalog",
    "/authentication-login",
    "/authentication-login/otp",
    "/authentication-login/signup",
  ],
};
