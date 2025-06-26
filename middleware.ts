import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware that enforces Supabase authentication and route protection in a Next.js application.
 *
 * Assigns a unique request ID to each incoming request, synchronizes authentication cookies, and restricts access to protected routes. Unauthenticated users attempting to access protected routes are redirected to the authentication page with a redirect parameter. Authenticated users are redirected away from authentication pages to the main dashboard.
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
    "/dashboard",
    "/account",
    // '/post',
    "/messages",
    "/settings",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  // Redirect to auth if accessing protected route without authentication
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/auth", request.url);
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
    return NextResponse.redirect(new URL("/", request.url));
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
