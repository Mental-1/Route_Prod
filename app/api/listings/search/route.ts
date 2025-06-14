import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { searchSchema } from "@/lib/validations";
import { generalApiLimiter, getClientIdentifier } from "@/utils/rate-limiting";
import { createAuditLogger } from "@/utils/audit-logger";

/**
 * Handles search requests for listings with rate limiting, input validation, audit logging, and paginated results.
 *
 * Processes search parameters from the request query string, validates input, enforces rate limits, logs the search action, and queries the database for matching listings. Returns a structured JSON response with listings, pagination info, applied filters, and metadata. Responds with appropriate error messages and status codes for rate limit violations, validation errors, or unexpected failures.
 *
 * @returns A JSON response containing search results, pagination details, applied filters, and metadata, or an error message with the relevant HTTP status code.
 *
 * @remark Returns HTTP 429 if the client exceeds the rate limit, 400 for invalid input, and 500 for server errors. Response includes rate limit and caching headers.
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = generalApiLimiter.check(clientId);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(
              rateLimitResult.resetTime,
            ).toISOString(),
          },
        },
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse parameters using your existing approach
    const input = {
      query: searchParams.get("q") || undefined,
      categoryId: searchParams.get("category")
        ? Number.parseInt(searchParams.get("category")!)
        : undefined,
      subcategoryId: searchParams.get("subcategory")
        ? Number.parseInt(searchParams.get("subcategory")!)
        : undefined,
      location: searchParams.get("location") || undefined,
      minPrice: searchParams.get("minPrice")
        ? Number.parseFloat(searchParams.get("minPrice")!)
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number.parseFloat(searchParams.get("maxPrice")!)
        : undefined,
      condition: searchParams.get("condition") || undefined,
      userLat: searchParams.get("lat")
        ? Number.parseFloat(searchParams.get("lat")!)
        : undefined,
      userLng: searchParams.get("lng")
        ? Number.parseFloat(searchParams.get("lng")!)
        : undefined,
      radius: searchParams.get("radius")
        ? Number.parseInt(searchParams.get("radius")!)
        : 50,
      sortBy: searchParams.get("sort") || "relevance",
      page: searchParams.get("page")
        ? Number.parseInt(searchParams.get("page")!)
        : 1,
      limit: Math.min(
        searchParams.get("limit")
          ? Number.parseInt(searchParams.get("limit")!)
          : 20,
        50, // Enforce maximum limit
      ),
    };

    // Enhanced validation with better error messages
    try {
      const validatedInput = searchSchema.parse(input);
      const supabase = await createServerSupabaseClient();

      // Log search for analytics (optional)
      const auditLogger = createAuditLogger({
        ip_address: clientId,
      });

      await auditLogger.log({
        action: "search_listings",
        resource_type: "search",
        metadata: {
          query: validatedInput.query,
          filters: {
            category: validatedInput.categoryId,
            location: validatedInput.location,
            priceRange: [validatedInput.minPrice, validatedInput.maxPrice],
          },
        },
      });

      // Use your existing RPC function
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
        radius_km: validatedInput.radius,
        sort_by: validatedInput.sortBy,
        page_limit: validatedInput.limit,
        page_offset: (validatedInput.page - 1) * validatedInput.limit,
      });

      if (error) {
        console.error("Search error:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Search failed",
            message: "Unable to complete search. Please try again.",
            details:
              process.env.NODE_ENV === "development"
                ? error.message
                : undefined,
          },
          { status: 500 },
        );
      }

      const totalCount = listings?.length || 0;
      const hasNextPage = totalCount === validatedInput.limit;

      // Enhanced response with your existing structure plus additional metadata
      const response = NextResponse.json({
        success: true,
        listings: listings || [],
        totalCount,
        hasNextPage,
        page: validatedInput.page,
        limit: validatedInput.limit,
        // Additional metadata for better client handling
        meta: {
          searchQuery: validatedInput.query,
          appliedFilters: {
            category: validatedInput.categoryId,
            subcategory: validatedInput.subcategoryId,
            location: validatedInput.location,
            priceRange: {
              min: validatedInput.minPrice,
              max: validatedInput.maxPrice,
            },
            condition: validatedInput.condition,
            radius: validatedInput.radius,
          },
          sortBy: validatedInput.sortBy,
          timestamp: new Date().toISOString(),
        },
      });

      // Add caching headers for better performance
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=300",
      );
      response.headers.set(
        "X-RateLimit-Remaining",
        rateLimitResult.remaining.toString(),
      );

      return response;
    } catch (validationError) {
      console.error("Search validation error:", validationError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid search parameters",
          message: "Please check your search criteria and try again.",
          details:
            process.env.NODE_ENV === "development"
              ? validationError
              : undefined,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
