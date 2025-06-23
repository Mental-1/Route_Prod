import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export const createBrowserClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: "routeme-auth",
          storage:
            typeof window !== "undefined" ? window.localStorage : undefined,
        },
      },
    );
  }

  return supabaseClient;
};
