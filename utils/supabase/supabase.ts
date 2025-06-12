import { createClient as supabaseCreateClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Singleton pattern for browser client
let supabaseClient: ReturnType<typeof supabaseCreateClient> | null = null;

// Create a single supabase client for the browser
export const createClient = () => {
  if (typeof window === "undefined") {
    // Server-side: create a new client each time
    return supabaseCreateClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  // Browser-side: use singleton
  if (!supabaseClient) {
    supabaseClient = supabaseCreateClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: "routeme-auth",
          storage: window.localStorage,
        },
      },
    );
  }

  return supabaseClient;
};

// Create a server client for SSR
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies: Array<{ name: string; value: string; options: any }>) {
          cookies.forEach((cookie) => {
            cookieStore.set({
              name: cookie.name,
              value: cookie.value,
              ...cookie.options,
            });
          });
        },
      },
    },
  );
};
