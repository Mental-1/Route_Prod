import { createBrowserClient } from "@/utils/supabase/supabase-browser";
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
  category_id: number | null; // Assuming category_id is a number using the same type as in the database
  subcategory_id: number | null; // Assuming subcategory_id is a number using the same type as in the database
  createdAt: string | null; // Assuming created_at is a string in ISO format
}

/**
 * Retrieves up to eight of the most recent listings created within the last four days.
 *
 * Fetches listing data from the backend, transforms it into display-friendly objects, and returns an array of `DisplayListingItem`. If an error occurs during fetching, returns an empty array.
 *
 * @returns An array of recent listings formatted for display.
 */
export async function getRecentListings(): Promise<DisplayListingItem[]> {
  const supabase = createBrowserClient();

  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

  const { data, error } = await supabase
    .from("listings")
    .select("id, title, price, location, views, images, condition")
    .gte("created_at", fourDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Error fetching recent listings:", error.message);
    throw new Error("Failed to fetch recent listings");
  }

  const transformedListings: DisplayListingItem[] = data.map((listing) => ({
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
}: {
  page?: number;
  pageSize?: number;
  filters?: {
    categories?: number[];
    subcategories?: number[];
    conditions?: string[];
    priceRange?: { min: number; max: number };
  };
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} = {}): Promise<ListingsItem[]> {
  const supabase = createBrowserClient();

  let query = supabase
    .from("listings")
    .select(
      "id, title, description, price, images, condition, location, views, category_id, subcategory_id, created_at",
    )
    .order(sortBy, { ascending: sortOrder === "asc" })
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
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching listings:", error?.message);
    throw new Error("Failed to fetch listings");
    return [];
  }

  return (data || []).map((listing) => ({
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
    createdAt: listing.created_at,
  }));
}
