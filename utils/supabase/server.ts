"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import type { Database } from "@/utils/supabase/database.types";
import { serializeCookieHeader } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Next.js server components with read-only cookie access.
 *
 * The client is configured using environment variables for the Supabase URL and anon key. Cookie retrieval is supported, but attempts to set cookies are silently ignored if not permitted in the server component context.
 *
 * @returns A Supabase client instance typed with the application database.
 */
export async function getSupabaseServer() {
  const cookieStore = await nextCookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

/**
 * Creates a Supabase client for Next.js route handlers and server actions with full cookie read/write access.
 *
 * The client manages authentication and session cookies using the Next.js cookies API, supporting persistent user sessions in server-side contexts.
 *
 * @returns A Supabase client instance typed with the application's database schema.
 */
export async function getSupabaseRouteHandler(cookiesFn: typeof nextCookies) {
  const cookieStore = await cookiesFn();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}

/**
 * Creates a Supabase client for Next.js middleware, managing cookies through HTTP request and response headers.
 *
 * Parses cookies from the incoming request and enables setting new cookies by appending `Set-Cookie` headers to the response.
 *
 * @param request - The incoming HTTP request containing cookies in its headers.
 * @returns An object with the configured Supabase client and a response object with updated cookie headers.
 */
export async function getSupabaseMiddleware(request: Request) {
  const response = new Response();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = new Map();
          request.headers
            .get("cookie")
            ?.split(";")
            .forEach((cookie) => {
              const [name, value] = cookie.trim().split("=");
              if (name && value) {
                cookies.set(name, decodeURIComponent(value));
              }
            });
          return Array.from(cookies.entries()).map(([name, value]) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options),
            );
          });
        },
      },
    },
  );

  return { supabase, response };
}

/**
 * Creates a Supabase client with service role privileges for admin-level operations.
 *
 * Throws an error if the service role key environment variable is not set. Cookie handling is disabled for this client.
 * @returns A Supabase client instance with service role access.
 */
export async function getSupabaseServiceRole() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is not set",
    );
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
