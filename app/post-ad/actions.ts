"use server";

import { getSupabaseServer } from "@/utils/supabase/server";
import { Database } from "@/utils/supabase/database.types";

export type Plan = Database["public"]["Tables"]["plans"]["Row"];

export async function getPlans(): Promise<Plan[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.from("plans").select("*");

  if (error) {
    console.error("Error fetching plans:", error);
    return [];
  }

  return data || [];
}
