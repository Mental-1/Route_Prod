import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * Handles GET requests to retrieve a single active listing by its ID, including related category, subcategory, and seller profile information.
 *
 * @param request - The incoming HTTP request.
 * @param params - An object containing the listing ID as `id`.
 * @returns A JSON response with the listing data if found, or an error message with the appropriate HTTP status code if not found or if an internal error occurs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: listing, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        category:categories(name),
        subcategory:subcategories(name),
        seller:profiles(id, full_name, user_name, avatar_url)
      `,
      )
      .eq("id", params.id)
      .eq("status", "active")
      .single();

    if (error || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
