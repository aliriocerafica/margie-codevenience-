import { auth } from "@/auth";

export default auth((req) => {
  const privateRoutes = ["/category", "/dashboard", "/product"];

  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;

  const url = "https://margie-codevenience.vercel.app";

  const { pathname } = req.nextUrl;

  const isRootRoute = pathname === "/";
  const isSignupRoute = pathname === "/signup";
  const isAuthRoute = pathname.includes("/account/");
  const isPrivateRoute = privateRoutes.includes(pathname);
  const isAdminRoute = pathname.includes("/admin");
  const isDashboardRoute = pathname.includes("/dashboard");

  // 🚫 Prevent logged-in users from accessing root, signup, and auth routes
  if (isLoggedIn && (isRootRoute || isSignupRoute || isAuthRoute)) {
    if (user?.role === "Admin") {
      return Response.redirect(`${url}/dashboard`);
    }

    // 🚧 Future role: Staff
    // if (user?.role === "Staff") {
    //   return Response.redirect(`${url}/dashboard`);
    // }
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

  // Protect dashboard routes (currently only Admins allowed)
  if (isDashboardRoute) {
    if (!isLoggedIn || user?.role !== "Admin") {
      return Response.redirect(`${url}/signup`);
    }

    // 🚧 Future role: Staff
    // if (user?.role === "Staff") {
    //   return; // Staff can access dashboard
    // }
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
