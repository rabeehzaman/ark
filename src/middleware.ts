import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow auth API routes and login page
  if (pathname.startsWith("/api/auth") || pathname === "/login") {
    return;
  }

  // Redirect unauthenticated users to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  // Super admin trying to access regular pages -> redirect to /admin
  if (req.auth.user.role === "SUPER_ADMIN" && !pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
    return Response.redirect(new URL("/admin", req.url));
  }

  // Regular user trying to access admin pages -> redirect to /
  if (req.auth.user.role !== "SUPER_ADMIN" && pathname.startsWith("/admin")) {
    return Response.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
