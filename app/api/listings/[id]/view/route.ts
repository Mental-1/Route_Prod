import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";

type IncrementListingViewsResult = {
  views: number;
};
type IncrementListingViewsArg = {
  listing_id: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await getSupabaseRouteHandler();

    // Increment view count using RPC function
    const { data, error } = await supabase.rpc<
      IncrementListingViewsResult,
      IncrementListingViewsArg
    >("increment_listing_views", {
      listing_id: params.id,
    });

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
