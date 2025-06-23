import { createBrowserClient } from "@supabase/ssr"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Creates and returns a Supabase client configured for browser environments using public environment variables.
 *
 * @returns A Supabase client instance for client-side operations
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Asynchronously creates and returns a Supabase client configured for use in Next.js server components, with cookie management integrated via the Next.js cookie store.
 */
export async function createServerComponentClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: { path?: string; maxAge?: number; domain?: string } }[]) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set({ name, value, ...options })
          }
        },
      },
    }
  )
}

/**
 * Creates and returns a Supabase client configured for use within Next.js route handlers.
 *
 * The client is initialized with environment variables and integrates with the Next.js cookie store to manage authentication and session cookies.
 */
export async function createRouteHandlerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: { path?: string; maxAge?: number; domain?: string } }[]) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set({ name, value, ...options })
          }
        },
      },
    }
  )
}
