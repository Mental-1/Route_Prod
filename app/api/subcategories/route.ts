import { NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");

    const supabase = await getSupabaseRouteHandler();

    let query = supabase.from("subcategories").select("*").order("name");

    if (categoryId) {
      query = query.eq("parent_category_id", Number(categoryId));
    }

    const { data: subcategories, error } = await query;

    if (error) {
      console.error("Error fetching subcategories:", error);
      return NextResponse.json(
        { error: "Failed to fetch subcategories" },
        { status: 500 },
      );
    }

    return NextResponse.json(subcategories);
  } catch (error) {
    console.error("Subcategories API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
