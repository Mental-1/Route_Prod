import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/supabase/database.types";

export type TypedSupabaseClient = SupabaseClient<Database>;
