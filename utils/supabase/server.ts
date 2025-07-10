import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/supabase/database.types";
import { serializeCookieHeader } from "@supabase/ssr";

// The correct schema type Supabase now expects
type Schema = Database["public"];

/**
 * SSR client for Server Components (read-only cookies)
 */
export async function getSupabaseServer(): Promise<SupabaseClient<Schema>> {
  const cookieStore = await nextCookies();

  const client = createServerClient<Schema>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Silent fail in server component context
          }
        },
      },
    },
  );

  return client;
}

/**
 * Supabase client for Route Handlers/Server Actions (read-write cookies)
 */
export async function getSupabaseRouteHandler(
  cookiesFn: typeof nextCookies,
): Promise<SupabaseClient<Schema>> {
  const cookieStore = await cookiesFn();

  const client = createServerClient<Schema>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  return client;
}

/**
 * Supabase client for Middleware (header-based cookies)
 */
export function getSupabaseMiddleware(request: Request): {
  supabase: SupabaseClient<Schema>;
  response: Response;
} {
  const response = new Response();

  const client = createServerClient<Schema>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          const cookieMap = new Map<string, string>();
          request.headers
            .get("cookie")
            ?.split(";")
            .forEach((cookie) => {
              const [name, value] = cookie.trim().split("=");
              if (name && value) {
                cookieMap.set(name, decodeURIComponent(value));
              }
            });
          return Array.from(cookieMap.entries()).map(([name, value]) => ({
            name,
            value,
          }));
        },
        setAll: (cookiesToSet) => {
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

  return {
    supabase: client,
    response,
  };
}

/**
 * Supabase client using Service Role Key (no cookies)
 */
export function getSupabaseServiceRole(): SupabaseClient<Schema> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  const client = createServerClient<Schema>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );

  return client;
}
