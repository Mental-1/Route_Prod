import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchSchema } from "@/lib/validations"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const input = {
      query: searchParams.get("q") || undefined,
      categoryId: searchParams.get("category") ? Number.parseInt(searchParams.get("category")!) : undefined,
      subcategoryId: searchParams.get("subcategory") ? Number.parseInt(searchParams.get("subcategory")!) : undefined,
      location: searchParams.get("location") || undefined,
      minPrice: searchParams.get("minPrice") ? Number.parseFloat(searchParams.get("minPrice")!) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number.parseFloat(searchParams.get("maxPrice")!) : undefined,
      condition: searchParams.get("condition") || undefined,
      userLat: searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat")!) : undefined,
      userLng: searchParams.get("lng") ? Number.parseFloat(searchParams.get("lng")!) : undefined,
      radiusKm: searchParams.get("radius") ? Number.parseInt(searchParams.get("radius")!) : 50,
      sortBy: searchParams.get("sort") || "relevance",
      page: searchParams.get("page") ? Number.parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 20,
    }

    const validatedInput = searchSchema.parse(input)
    const supabase = createClient()

    const { data: listings, error } = await supabase.rpc("search_listings", {
      search_query: validatedInput.query,
      category_filter: validatedInput.categoryId,
      subcategory_filter: validatedInput.subcategoryId,
      location_filter: validatedInput.location,
      min_price_filter: validatedInput.minPrice,
      max_price_filter: validatedInput.maxPrice,
      condition_filter: validatedInput.condition,
      user_lat: validatedInput.userLat,
      user_lng: validatedInput.userLng,
      radius_km: validatedInput.radiusKm,
      sort_by: validatedInput.sortBy,
      page_limit: validatedInput.limit,
      page_offset: (validatedInput.page - 1) * validatedInput.limit,
    })

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    const totalCount = listings?.length || 0
    const hasNextPage = totalCount === validatedInput.limit

    return NextResponse.json({
      listings: listings || [],
      totalCount,
      hasNextPage,
      page: validatedInput.page,
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 })
  }
}
