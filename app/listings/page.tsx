import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { getListings } from "../../lib/data";
import { ListingsFilter } from "@/components/listings-filter";
import { ListingsDisplay } from "@/components/listings-display";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const queryClient = new QueryClient();
  const PAGE_SIZE = 20;

  const initialFilters = {
    categories: [],
    subcategories: [],
    conditions: [],
    priceRange: { min: 0, max: 1000000 },
    maxDistance: 5,
    searchQuery: searchParams.search ? String(searchParams.search) : "",
  };

  const urlSearchParams = new URLSearchParams(searchParams as Record<string, string>);

  const initialListings = await queryClient.fetchQuery({
    queryKey: ["listings", "all"],
    queryFn: () => getListings(1, PAGE_SIZE),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <ListingsFilter searchParams={urlSearchParams} />
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ListingsDisplay
              initialListings={initialListings ?? []}
              initialFilters={initialFilters}
              searchParams={searchParams}
            />
          </HydrationBoundary>
        </div>
      </div>
    </div>
  );
}