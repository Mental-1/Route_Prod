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

  const filters: {
    categories?: number[];
    subcategories?: number[];
    conditions?: string[];
    priceRange?: { min: number; max: number };
    maxDistance?: number;
  } = {
    conditions: Array.isArray(searchParams.conditions)
      ? searchParams.conditions.map(String)
      : searchParams.conditions
      ? String(searchParams.conditions).split(',').map(s => s.trim())
      : [],
    priceRange: {
      min: searchParams.priceMin ? Number(searchParams.priceMin) : 0,
      max: searchParams.priceMax ? Number(searchParams.priceMax) : 1000000,
    },
    maxDistance: searchParams.maxDistance ? Number(searchParams.maxDistance) : 5,
  };

  if (searchParams.category) {
    filters.categories = [Number(searchParams.category)];
  } else if (searchParams.categories) {
    filters.categories = Array.isArray(searchParams.categories)
      ? searchParams.categories.map(Number)
      : String(searchParams.categories).split(',').map(Number);
  } else {
    filters.categories = [];
  }

  if (searchParams.subcategory) {
    filters.subcategories = [Number(searchParams.subcategory)];
  } else if (searchParams.subcategories) {
    filters.subcategories = Array.isArray(searchParams.subcategories)
      ? searchParams.subcategories.map(Number)
      : String(searchParams.subcategories).split(',').map(Number);
  } else {
    filters.subcategories = [];
  }

  const sortBy = searchParams.sortBy ? String(searchParams.sortBy) : "newest";
  const searchQuery = searchParams.search ? String(searchParams.search) : undefined;

  const initialListings = await queryClient.fetchQuery({
    queryKey: ["listings", searchParams],
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