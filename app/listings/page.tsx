import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { getFilteredListings } from "../../lib/data";
import { ListingsFilter } from "@/components/listings-filter";
import { ListingsDisplay } from "@/components/listings-display";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const queryClient = new QueryClient();
  const PAGE_SIZE = 20;

  // Helper to get param values, handling string[] from Next.js searchParams
  const getParam = (key: string) => {
    const value = searchParams[key];
    if (Array.isArray(value)) {
      return value.join(',');
    }
    return value; // string or undefined
  };

  // Replicate the filter parsing logic from client-side (components/listings-display.tsx)
  const filters: {
    categories?: number[];
    subcategories?: number[];
    conditions?: string[];
    priceRange?: { min: number; max: number };
    maxDistance?: number;
  } = {
    conditions: getParam("conditions")
      ?.split(',')
      .map(s => s.trim())
      .filter(Boolean) || [],
    priceRange: {
      min: getParam("priceMin") ? Number(getParam("priceMin")) : 0,
      max: getParam("priceMax") ? Number(getParam("priceMax")) : 1000000,
    },
    maxDistance: getParam("maxDistance") ? Number(getParam("maxDistance")) : 5,
    searchQuery: getParam("search") || "",
  };

  const categoryParam = getParam("category");
  const categoriesParam = getParam("categories");
  if (categoryParam) {
    filters.categories = [Number(categoryParam)];
  } else if (categoriesParam) {
    filters.categories = categoriesParam.split(',').map(Number).filter(n => !isNaN(n));
  } else {
    filters.categories = [];
  }

  const subcategoryParam = getParam("subcategory");
  const subcategoriesParam = getParam("subcategories");
  if (subcategoryParam) {
    filters.subcategories = [Number(subcategoryParam)];
  } else if (subcategoriesParam) {
    filters.subcategories = subcategoriesParam.split(',').map(Number).filter(n => !isNaN(n));
  } else {
    filters.subcategories = [];
  }

  const sortBy = getParam("sortBy") ? String(getParam("sortBy")) : "newest";
  const searchQuery = getParam("search") ? String(getParam("search")) : undefined;

  // Construct the searchParamsString for the queryKey to match client-side
  const urlSearchParamsForQueryKey = new URLSearchParams();
  for (const key in searchParams) {
    const value = searchParams[key];
    if (Array.isArray(value)) {
      value.forEach(v => urlSearchParamsForQueryKey.append(key, v));
    } else if (value !== undefined) {
      urlSearchParamsForQueryKey.append(key, value);
    }
  }
  const searchParamsString = urlSearchParamsForQueryKey.toString();

  const initialListings = await queryClient.fetchQuery({
    queryKey: ["listings", searchParamsString, sortBy, null], // Match client-side queryKey
    queryFn: () => getFilteredListings({
      page: 1,
      pageSize: PAGE_SIZE,
      filters,
      sortBy,
      searchQuery,
      userLocation: null, // Initial server render, no user location yet
    }),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <ListingsFilter />
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ListingsDisplay
              initialListings={initialListings ?? []}
              searchParams={searchParams}
            />
          </HydrationBoundary>
        </div>
      </div>
    </div>
  );
}