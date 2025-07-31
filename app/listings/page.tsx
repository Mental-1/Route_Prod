import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { ListingsFilter } from "@/components/listings-filter";
import { ListingsDisplay } from "@/components/listings-display";
import { SearchService } from "@/lib/services/search-service";
import { parseSearchParams, createListingsQueryKey } from "@/lib/search-utils";
import { ListingsResponse } from "@/lib/types/search";

export default async function ListingsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const queryClient = new QueryClient();
  const PAGE_SIZE = 20;

  const filters = parseSearchParams(new URLSearchParams(searchParams as any));
  const sortBy = (searchParams.sortBy as string) || "newest";

  const queryKey = createListingsQueryKey(filters, sortBy, null);

  // Fetch the initial data directly on the server
  const initialData = await SearchService.getFilteredListings({
    page: 1,
    pageSize: PAGE_SIZE,
    filters,
    sortBy,
    userLocation: null,
  });

  // Manually prime the query cache with the server-fetched data
  await queryClient.prefetchInfiniteQuery({
    queryKey,
    queryFn: () => Promise.resolve(initialData), // We already have the data
    initialPageParam: 1,
    getNextPageParam: (lastPage: ListingsResponse) => {
      return lastPage.hasMore ? 2 : undefined;
    },
    pages: 1,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <ListingsFilter />
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ListingsDisplay />
          </HydrationBoundary>
        </div>
      </div>
    </div>
  );
}