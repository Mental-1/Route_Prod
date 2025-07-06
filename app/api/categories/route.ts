import { NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";

import { cookies } from "next/headers";

/**
 * Handles GET requests to retrieve all categories from the database, ordered by name.
 *
 * Returns a JSON response containing the list of categories on success, or an error message with a 500 status code if retrieval fails.
 */
export async function GET() {
  try {
    const supabase = await getSupabaseRouteHandler(cookies);

    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 },
      );
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
