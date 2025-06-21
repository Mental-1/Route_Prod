import { NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await getSupabaseRouteHandler();

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
