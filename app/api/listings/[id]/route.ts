import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await getSupabaseRouteHandler();

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
