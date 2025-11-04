import { auth } from "@/auth";

export default auth((req) => {
  const privateRoutes = [
    "/category",
    "/dashboard",
    "/product",
    "/users",
    "/scanqr",
    /* "/analytics", */ "/reports",
  ];

  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;

  const url = "https://margie-codevenience.vercel.app";
  // const url = "http://localhost:3000";
  const { pathname } = req.nextUrl;

  const isRootRoute = pathname === "/";
  const isSignupRoute = pathname === "/signup";
  const isAuthRoute = pathname.includes("/account/");
  const isPrivateRoute = privateRoutes.includes(pathname);
  const isAdminRoute = pathname.includes("/admin");
  const isReportsRoute = pathname.includes("/reports");
  const isDashboardRoute = pathname.includes("/dashboard");

  // 🚫 Prevent logged-in users from accessing root, signup, and auth routes
  if (isLoggedIn && (isRootRoute || isSignupRoute || isAuthRoute)) {
    return Response.redirect(`${url}/dashboard`);
  }

  // Protect private routes
  if (!isLoggedIn && isPrivateRoute) {
    return Response.redirect(`${url}/`);
  }

  // Protect admin routes (only Admins allowed)
  if (isAdminRoute) {
    if (!isLoggedIn || user?.role !== "Admin") {
      return Response.redirect(`${url}/`);
    }
  }

  // Protect reports routes (only Admins allowed)
  if (isReportsRoute) {
    if (!isLoggedIn || user?.role !== "Admin") {
      return Response.redirect(`${url}/`);
    }
  }

  // Protect dashboard routes (Admins + Staff allowed)
  if (isDashboardRoute) {
    const role = user?.role ?? ""; // fallback to empty string if undefined/null

    if (!isLoggedIn || !["Admin", "Staff"].includes(role)) {
      return Response.redirect(`${url}/signup`);
    }
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
