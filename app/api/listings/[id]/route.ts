import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { cookies } from "next/headers";

import pino from "pino";

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});

/**
 * Retrieves a single active listing by its ID, including related category, subcategory, and seller details.
 *
 * @param request - The incoming HTTP request
 * @param context - Contains route parameters, including the listing ID as `id`
 * @returns A JSON response with the listing data if found, or an error message with a 404 or 500 status code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    logger.debug(`Attempting to fetch listing with ID: ${id}`);
    const supabase = await getSupabaseRouteHandler(cookies);

    const { data: listing, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        latitude,
        longitude,
        category:categories(name),
        subcategory:subcategories(name),
        profiles!user_id(id, full_name, username, avatar_url)
      `,
      )
      .eq("id", id)
      .eq("status", "active")
      .single();

    if (error) {
      logger.error("Supabase error fetching listing:", error);
    }

    if (error || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    logger.error("Error fetching listing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
