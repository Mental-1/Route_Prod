import { getSupabaseClient } from "@/utils/supabase/client";
import { Toast } from "@/components/ui/toast";

export interface DisplayListingItem {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  views: number | null;
  images: string[] | null;
  condition: string | null;
  distance?: string;
}

export interface ListingsItem {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  images: string[] | null;
  condition: string | null;
  location: string | null;
  views: number | null;
  category_id: number | null;
  subcategory_id: number | null;
  created_at: string | null;
}

/**
 * Retrieves up to eight of the most recent listings created within the last four days.
 *
 * Fetches listing data from the backend, transforms it into display-friendly objects, and returns an array of `DisplayListingItem`. If an error occurs during fetching, returns an empty array.
 *
 * @returns An array of recent listings formatted for display.
 */
export async function getRecentListings(): Promise<DisplayListingItem[]> {
  const supabase = getSupabaseClient();

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data: recentListingsData, error: recentListingsError } = await supabase
    .from("listings")
    .select("id, title, price, location, views, images, condition")
    .gte("created_at", threeDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(8);

  if (recentListingsError) {
    console.error("Error fetching recent listings:", recentListingsError.message);
    throw new Error("Failed to fetch recent listings");
  }

  const transformedListings: DisplayListingItem[] = recentListingsData.map((listing) => ({
    id: listing.id,
    title: listing.title,
    price: listing.price,
    location: listing.location,
    views: listing.views,
    images: listing.images && listing.images.length > 0 ? listing.images : null,
    condition: listing.condition,
  }));

  return transformedListings;
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
export async function fetchListings({
  page = 1,
  pageSize = 10,
  filters = {},
  sortBy = "created_at",
  sortOrder = "desc",
  userLocation = null,
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
} = {}): Promise<ListingsItem[]> {
  const supabase = getSupabaseClient();

  const actualSortBy = sortBy === "newest" ? "created_at" : sortBy;

  let query = supabase
    .from("listings")
    .select(
      "id, title, description, price, images, condition, location, views, category_id, subcategory_id, created_at",
    )
    .order(actualSortBy, { ascending: sortOrder === "asc" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.categories && filters.categories.length > 0) {
    const validCategories = filters.categories
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);
    if (validCategories.length > 0) {
      query = query.in("category_id", validCategories);
    }
  }
  if (filters.subcategories && filters.subcategories.length > 0) {
    query = query.in("subcategory_id", filters.subcategories.map(Number));
  }
  if (filters.conditions && filters.conditions.length > 0) {
    query = query.in("condition", filters.conditions);
  }
  if (filters.priceRange) {
    query = query
      .gte("price", filters.priceRange.min)
      .lte("price", filters.priceRange.max);
  }

  let result: any;

  if (userLocation && filters.maxDistance !== undefined) {
    result = await supabase.rpc(
      "get_filtered_listings",
      {
        p_page: page,
        p_page_size: pageSize,
        p_sort_by: sortBy,
        p_sort_order: sortOrder,
        p_categories: filters.categories || [],
        p_subcategories: filters.subcategories || [],
        p_conditions: filters.conditions || [],
        p_min_price: filters.priceRange?.min || 0,
        p_max_price: filters.priceRange?.max || 1000000,
        p_user_latitude: userLocation.lat,
        p_user_longitude: userLocation.lon,
        p_radius_km: filters.maxDistance,
      },
    );
  } else {
    result = await query;
  }

  if (result.error) {
    console.error("Error fetching listings:", result.error.message);
    throw new Error("Failed to fetch listings");
  }

  const filteredData = (result.data && Array.isArray(result.data.listings) ? result.data.listings : result.data) || [];

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
