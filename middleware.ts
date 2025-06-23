import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware for authenticating and protecting routes using Supabase in a Next.js application.
 *
 * Assigns a unique request ID to each request, synchronizes cookies between request and response, and enforces authentication for specified protected routes. Redirects unauthenticated users to the sign-up page and redirects authenticated users away from authentication pages to the dashboard.
 */
export async function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  request.headers.set("x-request-id", requestId);

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // See https://supabase.com/docs/guides/auth/server-side/nextjs#auth-with-middleware-example
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect authenticated routes
  const protectedRoutes = [
    "/app/dashboard",
    "/app/account",
    // '/post',
    "/messages",
    "/app/settings",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  // Redirect to auth if accessing protected route without authentication
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/auth?tab=sign-up", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  if (
    user &&
    (request.nextUrl.pathname === "/auth" ||
      request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/signup")
  ) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api/auth (auth-related API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)",
  ],
};
