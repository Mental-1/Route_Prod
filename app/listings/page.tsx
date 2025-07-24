import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { getFilteredListings, getListings } from "../../lib/data";
import { ListingsFilter } from "@/components/listings-filter";
import { ListingsDisplay } from "@/components/listings-display";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const queryClient = new QueryClient();
  const PAGE_SIZE = 20;

  // Parse search parameters for filters
  const categoryParam = searchParams.category;
  const conditionsParam = searchParams.conditions;
  const priceMinParam = searchParams.priceMin;
  const priceMaxParam = searchParams.priceMax;
  const distanceParam = searchParams.distance;
  const subcategoryParam = searchParams.subcategory;

  const initialFilters = {
    categories: categoryParam
      ? [Number(categoryParam)].filter((n) => !isNaN(n))
      : [],
    subcategories: subcategoryParam
      ? [Number(subcategoryParam)].filter((n) => !isNaN(n))
      : [],
    conditions: conditionsParam
      ? Array.isArray(conditionsParam)
        ? conditionsParam
        : conditionsParam.split(",")
      : [],
    priceRange: {
      min: priceMinParam ? Number(priceMinParam) : 0,
      max: priceMaxParam ? Number(priceMaxParam) : 1000000,
    },
    maxDistance: distanceParam ? Number(distanceParam) : 5,
  };

  // Determine if any filters are active for the initial server fetch
  const isFilterActive = Object.values(initialFilters).some((filterValue) => {
    if (Array.isArray(filterValue)) return filterValue.length > 0;
    if (typeof filterValue === "object" && filterValue !== null) {
      return filterValue.min > 0 || filterValue.max < 1000000;
    }
    return filterValue !== undefined && filterValue !== 5;
  });

  // Server-side data fetching
  const initialListings = await queryClient.fetchQuery({
    queryKey: [
      "listings",
      initialFilters.categories,
      initialFilters.subcategories,
      initialFilters.conditions,
      initialFilters.priceRange,
      initialFilters.maxDistance,
      "newest",
      null,
    ],
    queryFn: () => {
      if (isFilterActive) {
        return getFilteredListings({
          page: 1,
          pageSize: PAGE_SIZE,
          filters: initialFilters,
          sortBy: "newest",
          userLocation: null,
        });
      }
      return getListings(1, PAGE_SIZE);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <ListingsFilter />
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ListingsDisplay
              initialListings={initialListings}
              initialFilters={initialFilters}
            />
          </HydrationBoundary>
        </div>
      </div>
    </div>
  );
}
