import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";

type IncrementListingViewsResult = {
  views: number;
};
type IncrementListingViewsArg = {
  Args: { listing_id: string };
  Returns: undefined;
};

/**
 * Handles a POST request to increment the view count for a listing by its ID.
 *
 * Increments the view count of the specified listing using a Supabase RPC call and returns the updated view count in the response. Returns appropriate error responses if the listing is not found or if a database or server error occurs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await getSupabaseRouteHandler();

    // Increment view count using RPC function
    const { data, error } = await supabase.rpc(
      "increment_listing_views",
      { listing_uuid: params.id }
    );

    if (error) {
      return NextResponse.json({ error: "Database Error" }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, views: data[0].views });
  } catch (error) {
    console.error("Error in view endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
