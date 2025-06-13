import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Increment view count using RPC function
    const { error } = await supabase.rpc("increment_listing_views", {
      listing_id: params.id,
    });

    if (error) {
      console.error("Error incrementing views:", error);
      return NextResponse.json(
        { error: "Failed to update views" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in view endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
