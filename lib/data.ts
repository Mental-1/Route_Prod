import { getSupabaseClient } from "@/utils/supabase/client";
import { DisplayListingItem, ListingsItem } from "@/lib/types/listing";

/**
 * Retrieves up to eight of the most recent listings created within the last four days.
 *
 * Fetches listing data from the backend, transforms it into display-friendly objects, and returns an array of `DisplayListingItem`. If an error occurs during fetching, returns an empty array.
 *
 * @returns An array of recent listings formatted for display.
 */
export async function getRecentListings(
  page = 1,
  pageSize = 20,
): Promise<DisplayListingItem[]> {
  const supabase = getSupabaseClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentListingsData, error: recentListingsError } =
    await supabase
      .from("listings")
      .select(
        "id, title, price, location, views, images, condition, description",
      )
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

  if (recentListingsError) {
    console.error(
      "Error fetching recent listings:",
      recentListingsError.message,
    );
    throw new Error("Failed to fetch recent listings");
  }

  const transformedListings: DisplayListingItem[] = recentListingsData.map(
    (listing) => ({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      location: listing.location,
      views: listing.views,
      images:
        listing.images && listing.images.length > 0 ? listing.images : null,
      condition: listing.condition,
      description: listing.description,
    }),
  );

  return transformedListings;
}

/**
 * Fetches a paginated list of all listings from the database without any filtering.
 *
 * @param page - The page number to retrieve (default is 1)
 * @param pageSize - The number of listings per page (default is 20)
 * @returns An array of listings.
 */
export async function getListings(
  page = 1,
  pageSize = 20,
): Promise<ListingsItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, title, description, price, images, condition, location, views, category_id, subcategory_id, created_at",
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("Error fetching listings:", error.message);
    throw new Error("Failed to fetch listings");
  }

  return data || [];
}

/**
 * Fetches a paginated list of listings from the database with optional filtering and sorting.
 *
 * Applies filters for categories, subcategories, conditions, and price range if provided. Results are sorted and paginated according to the specified parameters.
 *
 * @param page - The page number to retrieve (default is 1)
 * @param pageSize - The number of listings per page (default is 10)
 * @param filters - Optional filters for categories, subcategories, conditions, and price range
 * @param sortBy - The field to sort by (default is "created_at")
 * @param sortOrder - The sort order, either "asc" or "desc" (default is "desc")
 * @returns An array of listings matching the specified criteria
 */
export async function getFilteredListings({
  page = 1,
  pageSize = 10,
  filters = {},
  sortBy = "created_at",
  sortOrder = "desc",
  userLocation = null,
  searchQuery,
}: {
  page?: number;
  pageSize?: number;
  filters?: {
    categories?: number[];
    subcategories?: number[];
    conditions?: string[];
    priceRange?: { min: number; max: number };
    maxDistance?: number;
  };
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  userLocation?: { lat: number; lon: number } | null;
  searchQuery?: string;
} = {}): Promise<ListingsItem[]> {
  const supabase = getSupabaseClient();

  const actualSortBy = sortBy === "newest" ? "created_at" : sortBy;

  // Always call the RPC function with all parameters
  const result = await supabase.rpc("get_filtered_listings", {
    p_page: page,
    p_page_size: pageSize,
    p_sort_by: actualSortBy,
    p_sort_order: sortOrder,
    p_categories: filters.categories || [],
    p_subcategories: filters.subcategories || [],
    p_conditions: filters.conditions || [],
    p_min_price: filters.priceRange?.min || 0,
    p_max_price: filters.priceRange?.max || 1000000,
    p_user_latitude: userLocation?.lat || null,
    p_user_longitude: userLocation?.lon || null,
    p_radius_km: filters.maxDistance || null,
    p_search_query: searchQuery || null,
  });

  if (result.error) {
    console.error("Error fetching listings:", result.error.message);
    throw new Error("Failed to fetch listings");
  }

  const filteredData =
    (result.data && Array.isArray(result.data.listings)
      ? result.data.listings
      : result.data) || [];

  return filteredData.map((listing: ListingsItem) => ({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    images: listing.images,
    condition: listing.condition,
    location: listing.location,
    views: listing.views,
    category_id: listing.category_id,
    subcategory_id: listing.subcategory_id,
    created_at: listing.created_at,
  }));
}
// In lib/data.ts around lines 130 to 154, the current code fetches all listings
// before filtering by distance, which is inefficient for large datasets. To fix
// this, modify the RPC function to accept all filter criteria including distance
// and perform the entire filtering within the database query. Update the code to
// call this enhanced RPC directly with all filters, eliminating the need to fetch
// and filter listings client-side.
