import{
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { ListingsFilter } from "@/components/listings-filter";
import { ListingsDisplay } from "@/components/listings-display";
import { SearchService } from "@/lib/services/search-service";
import { parseSearchParams } from "@/lib/search-utils";
import { ListingsResponse } from "@/lib/types/search";
import { createListingsQueryKey } from "@/lib/search-utils";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const queryClient = new QueryClient();
  const PAGE_SIZE = 20;

  const filters = parseSearchParams(new URLSearchParams(searchParams as any));
  const sortBy = (searchParams.sortBy as string) || "newest";

  const queryKey = createListingsQueryKey(filters, sortBy, null);

  await queryClient.prefetchInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const results = await SearchService.getFilteredListings({
        page: pageParam,
        pageSize: PAGE_SIZE,
        filters,
        sortBy,
        userLocation: null, // You might want to get user location here
      });
      return results; // This should match InfiniteData<ListingsResponse>
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: ListingsResponse, allPages: ListingsResponse[]) => {
      // Check if the last page had data and if we expect more data
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
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
